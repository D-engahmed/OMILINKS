"""Tenant profile routes: /tenants/me (GET, PATCH)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_request_context, require
from app.core.context import RequestContext
from app.db.session import get_db
from app.domains.tenants.models.tenant import Tenant
from app.domains.tenants.schemas.tenant import TenantOut, TenantUpdate

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/me", response_model=TenantOut, dependencies=[Depends(require("tenant.view"))])
async def get_my_tenant(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    tenant = await db.get(Tenant, ctx.tenant_id)
    if tenant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenant not found")
    return tenant


@router.patch("/me", response_model=TenantOut, dependencies=[Depends(require("tenant.manage"))])
async def update_my_tenant(
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    tenant = await db.get(Tenant, ctx.tenant_id)
    if tenant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tenant not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.get(
    "/me/usage",
    dependencies=[Depends(require("billing.view"))],
)
async def get_usage(ctx: RequestContext = Depends(get_request_context)):
    # TODO: implement seat/message/credit usage from billing domain
    return {
        "tenant_id": str(ctx.tenant_id),
        "seats_used": 0,
        "messages_used": 0,
        "ai_credits_used": 0,
    }
