"""Seed permissions catalog + six system role templates (ch.13 §6)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.domains.platform.models.platform_user  # noqa: F401
import app.domains.tenants.models.membership  # noqa: F401

# Ensure tenant tables are registered on the metadata (Role.tenant_id FK -> tenants)
import app.domains.tenants.models.tenant  # noqa: F401
from app.domains.access.models.rbac import Permission, Role, RolePermission
from app.domains.access.services.catalog import PERMISSION_CATALOG
from app.domains.access.services.role_templates import SYSTEM_ROLE_TEMPLATES
from app.domains.tenants.models.enums import RoleScope


async def seed_rbac(db: AsyncSession) -> None:
    # 1. Permissions
    existing = set((await db.scalars(select(Permission.code))).all())
    for code, category, description in PERMISSION_CATALOG:
        if code not in existing:
            db.add(Permission(code=code, category=category, description=description))

    await db.flush()

    # 2. System role templates (tenant_id IS NULL, immutable)
    existing_roles = set(
        (await db.scalars(select(Role.name).where(Role.tenant_id.is_(None)))).all()
    )
    for name, (scope_str, perms) in SYSTEM_ROLE_TEMPLATES.items():
        if name in existing_roles:
            continue
        role = Role(
            name=name,
            scope=RoleScope(scope_str),
            is_system=True,
            is_custom=False,
        )
        db.add(role)
        await db.flush()
        for code in perms:
            db.add(RolePermission(role_id=role.id, permission_code=code))

    await db.commit()
