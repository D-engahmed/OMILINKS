"""Tenant provisioning (ch.13 §8.1) — creates tenant, default team, first admin.

Invariants:
  S1 — every tenant has >=1 team (default team, is_default=true)
  S2 — every team has >=1 member holding team.manage (Team Admin)
  The last Tenant Admin cannot be demoted (enforced in user service).
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.domains.access.models.rbac import Role
from app.domains.tenants.models.enums import (
    TeamStatus,
    TenantStatus,
    TenantType,
    UserStatus,
)
from app.domains.tenants.models.membership import TeamMembership, TenantRoleAssignment
from app.domains.tenants.models.plan import Plan  # noqa: F401  (tenants.plan_id FK target)
from app.domains.tenants.models.tenant import Team, Tenant, User


async def provision_tenant(
    *,
    db: AsyncSession,
    name: str,
    slug: str,
    email: str,
    tenant_type: TenantType = TenantType.INDIVIDUAL,
    password: str | None = None,
) -> Tenant:
    tenant = Tenant(
        name=name,
        slug=slug,
        type=tenant_type,
        status=TenantStatus.TRIAL,
    )
    db.add(tenant)
    await db.flush()

    # Default team (S1)
    team = Team(
        tenant_id=tenant.id,
        name="General",
        is_default=True,
        status=TeamStatus.ACTIVE,
    )
    db.add(team)
    await db.flush()

    # First user (INVITED -> ACTIVE on first login)
    user = User(
        tenant_id=tenant.id,
        email=email,
        password_hash=hash_password(password or str(uuid.uuid4())),
        status=UserStatus.INVITED,
    )
    db.add(user)
    await db.flush()

    # Resolve system templates by name
    roles = (await db.scalars(select(Role).where(Role.tenant_id.is_(None)))).all()
    role_by_name = {r.name: r for r in roles}
    tenant_admin = role_by_name["Tenant Admin"]
    team_admin = role_by_name["Team Admin"]

    # Tenant-scope admin (S5)
    db.add(TenantRoleAssignment(tenant_id=tenant.id, user_id=user.id, role_id=tenant_admin.id))
    # Team-scope admin (S2)
    db.add(
        TeamMembership(
            team_id=team.id,
            user_id=user.id,
            role_id=team_admin.id,
            is_primary=True,
        )
    )

    await db.commit()
    return tenant
