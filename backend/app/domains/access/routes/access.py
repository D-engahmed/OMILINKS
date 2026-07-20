"""Access-control routers: roles, permission catalog, audit (ch.13 Appendix B)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_request_context, require
from app.db.session import get_db
from app.domains.access.models.rbac import Role
from app.domains.access.services.catalog import PERMISSION_CATALOG

router = APIRouter(tags=["access"])


@router.get("/permissions")
async def list_permissions(_: None = Depends(get_request_context)):
    return [
        {"code": code, "category": cat, "description": desc}
        for code, cat, desc in PERMISSION_CATALOG
    ]


@router.get("/roles")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    ctx=Depends(get_request_context),
):
    rows = (
        await db.scalars(select(Role).where(Role.tenant_id.is_(None) | (Role.tenant_id == ctx.tenant_id)))
    ).all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "scope": r.scope.value,
            "is_system": r.is_system,
            "is_custom": r.is_custom,
        }
        for r in rows
    ]


@router.post("/roles/custom", dependencies=[Depends(require("role.manage"))])
async def create_custom_role():
    # Enterprise custom-role creation (ch.13 §8.2) — stubbed until P1
    return {"status": "custom roles land in Enterprise tier (P1)"}
