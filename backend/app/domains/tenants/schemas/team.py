"""Team schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.domains.tenants.models.enums import TeamStatus


class TeamCreate(BaseModel):
    name: str
    settings: dict = {}


class TeamUpdate(BaseModel):
    name: str | None = None
    status: TeamStatus | None = None
    settings: dict | None = None


class TeamOut(BaseModel):
    id: UUID
    tenant_id: UUID
    name: str
    is_default: bool
    status: TeamStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class TeamMemberAdd(BaseModel):
    user_id: UUID
    role_id: UUID
    is_primary: bool = False


class TeamMemberUpdate(BaseModel):
    role_id: UUID | None = None
    is_primary: bool | None = None


class TeamMemberOut(BaseModel):
    user_id: UUID
    role_id: UUID
    is_primary: bool
    max_concurrent_conversations: int
    joined_at: datetime | None = None
    user_email: str = ""
    user_full_name: str = ""
    role_name: str = ""

    model_config = {"from_attributes": True}
