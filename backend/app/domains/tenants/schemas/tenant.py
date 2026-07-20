"""Pydantic schemas for tenant + team + user API (ch.13 Appendix B)."""

from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.domains.tenants.models.enums import (
    TenantStatus,
    TenantType,
    UserStatus,
)


class TenantCreate(BaseModel):
    name: str
    slug: str
    email: str
    type: TenantType = TenantType.INDIVIDUAL


class TenantOut(BaseModel):
    id: UUID
    name: str
    slug: str
    type: TenantType
    status: TenantStatus
    country: str | None

    model_config = {"from_attributes": True}


class TeamCreate(BaseModel):
    name: str
    settings: dict = {}


class TeamOut(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    is_default: bool
    status: str

    model_config = {"from_attributes": True}


class TeamMemberAdd(BaseModel):
    user_id: UUID
    role_id: UUID


class UserInvite(BaseModel):
    email: EmailStr
    full_name: str = ""
    team_id: UUID


class UserOut(BaseModel):
    id: UUID
    tenant_id: UUID
    email: str
    full_name: str
    status: UserStatus

    model_config = {"from_attributes": True}
