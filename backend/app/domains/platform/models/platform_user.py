"""Platform users — separate plane, NOT part of tenant RBAC (ch.13 §1/S6)."""

import uuid

from sqlalchemy import Boolean, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin
from app.db.enums import sa_enum
from app.domains.tenants.models.enums import PlatformRole


class PlatformUser(Base, TimestampMixin):
    __tablename__ = "platform_users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[PlatformRole] = mapped_column(
        sa_enum(PlatformRole, name="platform_role"), nullable=False
    )
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=True)  # mandatory true
