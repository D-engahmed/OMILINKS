"""Auth routes: tenant login (issues plane=tenant JWT)."""


from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.core.security import verify_password
from app.db.session import get_db
from app.domains.tenants.models.tenant import User

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = (
        await db.scalars(select(User).where(User.email == payload.email))
    ).first()
    if user is None or user.password_hash == "INVITED" or not verify_password(
        payload.password, user.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if user.status.value in ("deactivated", "suspended"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")

    token = create_access_token(subject=user.id, plane="tenant", tenant_id=user.tenant_id)
    return LoginResponse(access_token=token)
