"""User routes: /users (list, invite, update)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_request_context, require
from app.core.context import RequestContext
from app.db.session import get_db
from app.domains.tenants.models.tenant import User
from app.domains.tenants.schemas.common import MessageResponse
from app.domains.tenants.schemas.user import UserInvite, UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut], dependencies=[Depends(require("user.view.all"))])
async def list_users(
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    rows = (await db.scalars(select(User).where(User.tenant_id == ctx.tenant_id))).all()
    return list(rows)


@router.get(
    "/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require("user.view.all"))],
)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != ctx.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return user


@router.post(
    "/invites",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require("user.invite"))],
)
async def invite_user(
    payload: UserInvite,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    # Check duplicate email within tenant
    existing = (
        await db.scalars(
            select(User).where(User.tenant_id == ctx.tenant_id, User.email == payload.email)
        )
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, f"User '{payload.email}' already exists")

    user = User(
        tenant_id=ctx.tenant_id,
        email=payload.email,
        full_name=payload.full_name,
        password_hash="INVITED",  # set on first login
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch(
    "/{user_id}",
    response_model=UserOut,
    dependencies=[Depends(require("user.update.all"))],
)
async def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != ctx.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    response_model=MessageResponse,
    dependencies=[Depends(require("user.delete"))],
)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context),
):
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != ctx.tenant_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    # Cannot delete yourself
    if user.id == ctx.user_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete yourself")
    await db.delete(user)
    await db.commit()
    return MessageResponse(message=f"User '{user.email}' deleted")
