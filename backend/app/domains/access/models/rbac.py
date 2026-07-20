"""Role and Permission models — permission-based RBAC (ch.13 §4/§5)."""

import uuid

from sqlalchemy import (
    Boolean,
    ForeignKey,
    String,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.enums import sa_enum
from app.domains.tenants.models.enums import RoleScope


class Permission(Base):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(128), primary_key=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE")
    )  # NULL = system template
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    scope: Mapped[RoleScope] = mapped_column(
        sa_enum(RoleScope, name="role_scope"), nullable=False
    )
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)  # templates immutable
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)  # Enterprise (§8)

    permissions: Mapped[list["Permission"]] = relationship(
        secondary="role_permissions", lazy="selectin"
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_code: Mapped[str] = mapped_column(
        ForeignKey("permissions.code", ondelete="CASCADE"), primary_key=True
    )
