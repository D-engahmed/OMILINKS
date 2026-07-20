"""Request-time permission resolution (ch.13 §7.2).

Effective permissions = union of tenant-scope role permissions and each
team-membership role's permissions. Cached in Redis for `permission_cache_ttl`.
"""

import json
from uuid import UUID

import redis.asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.context import RequestContext
from app.domains.access.models.rbac import (
    Permission,
    RolePermission,
)
from app.domains.tenants.models.membership import TeamMembership, TenantRoleAssignment
from app.domains.tenants.models.plan import Plan  # noqa: F401  (tenants.plan_id FK target)

_redis = aioredis.from_url(settings.redis_url, decode_responses=True)


async def _load_context(db: AsyncSession, user_id: UUID, tenant_id: UUID) -> RequestContext:
    ctx = RequestContext(user_id=user_id, tenant_id=tenant_id)

    # Tenant-scope role permissions (union)
    tra_rows = (
        await db.scalars(
            select(TenantRoleAssignment).where(
                TenantRoleAssignment.user_id == user_id,
                TenantRoleAssignment.tenant_id == tenant_id,
            )
        )
    ).all()
    tenant_role_ids = [r.role_id for r in tra_rows]

    # Team memberships -> team-scoped permissions
    tm_rows = (
        await db.scalars(
            select(TeamMembership).where(TeamMembership.user_id == user_id)
        )
    ).all()
    team_role_ids = [m.role_id for m in tm_rows]
    team_map = {m.team_id: m.role_id for m in tm_rows}

    role_ids = list({*tenant_role_ids, *team_role_ids})
    if role_ids:
        perm_rows = await db.execute(
            select(Permission.code, RolePermission.role_id)
            .join(RolePermission, RolePermission.permission_code == Permission.code)
            .where(RolePermission.role_id.in_(role_ids))
        )
        for code, role_id in perm_rows.all():
            ctx.permissions.add(code)
            for team_id, rid in team_map.items():
                if rid == role_id:
                    ctx.team_permissions.setdefault(team_id, set()).add(code)

    return ctx


async def resolve_context(
    db: AsyncSession, user_id: UUID, tenant_id: UUID
) -> RequestContext:
    cache_key = f"perms:{user_id}"
    cached = await _redis.get(cache_key)
    if cached is not None:  # simple version: JSON blob set by _cache_context
        return _decode(cached)
    ctx = await _load_context(db, user_id, tenant_id)

    await _redis.set(cache_key, _encode(ctx), ex=settings.permission_cache_ttl)
    return ctx


async def invalidate_permissions(user_id: UUID) -> None:
    """Bump cache on any role/membership change (ch.13 §7.2)."""
    await _redis.delete(f"perms:{user_id}")


def _encode(ctx: RequestContext) -> str:


    return json.dumps(
        {
            "user_id": str(ctx.user_id),
            "tenant_id": str(ctx.tenant_id),
            "plane": ctx.plane,
            "permissions": list(ctx.permissions),
            "team_permissions": {
                str(t): list(p) for t, p in ctx.team_permissions.items()
            },
        }
    )


def _decode(raw: str) -> RequestContext:
    d = json.loads(raw)
    ctx = RequestContext(
        user_id=UUID(d["user_id"]),
        tenant_id=UUID(d["tenant_id"]),
        plane=d.get("plane", "tenant"),
        permissions=set(d.get("permissions", [])),
    )
    ctx.team_permissions = {
        UUID(t): set(p) for t, p in d.get("team_permissions", {}).items()
    }
    return ctx
