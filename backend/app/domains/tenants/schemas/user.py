"""User schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.domains.tenants.models.enums import UserStatus


class UserInvite(BaseModel):
    email: EmailStr
    full_name: str = ""
    team_id: UUID | None = None
    role_id: UUID | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    status: UserStatus | None = None
    locale: str | None = None


class UserOut(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str
    locale: str
    status: UserStatus
    mfa_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}
