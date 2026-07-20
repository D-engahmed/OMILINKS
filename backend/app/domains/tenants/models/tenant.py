"""Tenant, Team, and User models (ch.13 §4, ch.24 / ch.25 ERD)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import JSONB, Base, TimestampMixin
from app.db.enums import sa_enum
from app.domains.tenants.models.enums import (
    TeamStatus,
    TenantStatus,
    TenantType,
    UserStatus,
)

if TYPE_CHECKING:
    from app.domains.tenants.models.membership import TeamMembership, TenantRoleAssignment


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type: Mapped[TenantType] = mapped_column(
        sa_enum(TenantType, name="tenant_type"), nullable=False
    )
    industry: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[TenantStatus] = mapped_column(
        sa_enum(TenantStatus, name="tenant_status"), default=TenantStatus.TRIAL
    )
    plan_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("plans.id"))
    country: Mapped[str | None] = mapped_column(String(2))
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)

    teams: Mapped[list[Team]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan"
    )
    users: Mapped[list[User]] = relationship(back_populates="tenant")


class Team(Base, TimestampMixin):
    __tablename__ = "teams"
    __table_args__ = (UniqueConstraint("tenant_id", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[TeamStatus] = mapped_column(
        sa_enum(TeamStatus, name="team_status"), default=TeamStatus.ACTIVE
    )
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)

    tenant: Mapped[Tenant] = relationship(back_populates="teams")
    members: Mapped[list[TeamMembership]] = relationship(
        back_populates="team", cascade="all, delete-orphan"
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), index=True
    )
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="")
    locale: Mapped[str] = mapped_column(String(16), default="en")
    status: Mapped[UserStatus] = mapped_column(
        sa_enum(UserStatus, name="user_status"), default=UserStatus.INVITED
    )
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    tenant: Mapped[Tenant] = relationship(back_populates="users")
    memberships: Mapped[list[TeamMembership]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    tenant_roles: Mapped[list[TenantRoleAssignment]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
