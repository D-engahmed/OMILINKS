"""Auth routes: login + register (tenant provisioning)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.core.security import verify_password
from app.db.session import get_db
from app.domains.access.services.seed import seed_rbac
from app.domains.tenants.models.tenant import User
from app.domains.tenants.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.domains.tenants.schemas.tenant import TenantOut
from app.domains.tenants.services.provisioning import provision_tenant

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = (await db.scalars(select(User).where(User.email == payload.email))).first()
    if user is None or user.password_hash == "INVITED" or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if user.status.value in ("deactivated", "suspended"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    token = create_access_token(subject=user.id, plane="tenant", tenant_id=user.tenant_id)
    return LoginResponse(access_token=token)


@router.post("/register", response_model=TenantOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    await seed_rbac(db)
    tenant = await provision_tenant(
        db=db,
        name=payload.company_name,
        slug=payload.slug,
        email=payload.email,
        tenant_type=payload.type,
        password=payload.password,
    )
    return tenant
