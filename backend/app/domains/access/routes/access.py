"""Access-control routes: /access/roles + /access/permissions."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_request_context, require
from app.core.context import RequestContext
from app.db.session import get_db
from app.domains.access.models.rbac import Role, RolePermission
from app.domains.access.services.catalog import PERMISSION_CATALOG

router = APIRouter(prefix="/access", tags=["access"])


# ── Permission Catalog ──────────────────────────────────────────────────────


@router.get("/permissions")
async def list_permissions():
    return [
        {"code": code, "category": cat, "description": desc}
        for code, cat, desc in PERMISSION_CATALOG
    ]


# ── Roles ───────────────────────────────────────────────────────────────────


class RoleOut(BaseModel):
    id: UUID
    name: str
    scope: str
    is_system: bool
    is_custom: bool


class RoleCreate(BaseModel):
    name: str
    scope: str  # "tenant" | "team"
    permission_codes: list[str] = []


@router.get("/roles", response_model=list[RoleOut])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    rows = (
        await db.scalars(
            select(Role).where(Role.tenant_id.is_(None) | (Role.tenant_id == ctx.tenant_id))
        )
    ).all()
    return [
        RoleOut(
            id=r.id,
            name=r.name,
            scope=r.scope.value,
            is_system=r.is_system,
            is_custom=r.is_custom,
        )
        for r in rows
    ]


@router.post(
    "/roles",
    response_model=RoleOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require("role.manage"))],
)
async def create_role(
    payload: RoleCreate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    # Check duplicate name within tenant
    existing = (
        await db.scalars(
            select(Role).where(
                (Role.tenant_id == ctx.tenant_id) | Role.tenant_id.is_(None),
                Role.name == payload.name,
            )
        )
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Role '{payload.name}' already exists")

    role = Role(
        tenant_id=ctx.tenant_id,
        name=payload.name,
        scope=payload.scope,
        is_system=False,
        is_custom=True,
    )
    db.add(role)
    await db.flush()

    for code in payload.permission_codes:
        db.add(RolePermission(role_id=role.id, permission_code=code))

    await db.commit()
    await db.refresh(role)
    return RoleOut(
        id=role.id,
        name=role.name,
        scope=role.scope.value,
        is_system=role.is_system,
        is_custom=role.is_custom,
    )
