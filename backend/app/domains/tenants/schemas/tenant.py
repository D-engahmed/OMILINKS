"""Tenant schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.domains.tenants.models.enums import TenantStatus, TenantType


class TenantOut(BaseModel):
    id: UUID
    name: str
    slug: str
    type: TenantType
    status: TenantStatus
    country: str | None = None
    industry: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantUpdate(BaseModel):
    name: str | None = None
    country: str | None = None
    industry: str | None = None
    settings: dict | None = None
