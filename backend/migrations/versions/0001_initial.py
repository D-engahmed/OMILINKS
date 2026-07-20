"""Initial schema: tenancy, teams, users, RBAC, platform users (ch.13 / ch.24 / ch.25).

Run `alembic upgrade head` against a Postgres database. The `plans` table
referenced by `tenants.plan_id` is created here as a stub; full plan catalog
lands in the billing domain.
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "plans",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("tier", sa.String(64), nullable=False),
        sa.Column("seat_limit", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("ai_credit_allocation", sa.Integer(), nullable=False, server_default="0"),
    )

    op.create_table(
        "tenants",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("type", sa.Enum("individual", "startup", "small_business", "medium_business",
                                  "enterprise", "nonprofit", "government", "education",
                                  name="tenant_type"), nullable=False),
        sa.Column("industry", sa.String(255)),
        sa.Column("status", sa.Enum("trial", "active", "suspended", "deleted",
                                    name="tenant_status"), nullable=False, server_default="trial"),
        sa.Column("plan_id", sa.Uuid(), sa.ForeignKey("plans.id")),
        sa.Column("country", sa.String(2)),
        sa.Column("settings", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )

    op.create_table(
        "teams",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("status", sa.Enum("active", "archived", name="team_status"),
                  nullable=False, server_default="active"),
        sa.Column("settings", sa.JSON(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "name"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False, server_default=""),
        sa.Column("locale", sa.String(16), nullable=False, server_default="en"),
        sa.Column("status", sa.Enum("invited", "active", "deactivated", "suspended",
                                    name="user_status"), nullable=False, server_default="invited"),
        sa.Column("mfa_enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("tenant_id", "email"),
    )

    op.create_table(
        "permissions",
        sa.Column("code", sa.String(128), primary_key=True),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("description", sa.String(255), nullable=False, server_default=""),
    )

    op.create_table(
        "roles",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("scope", sa.Enum("tenant", "team", name="role_scope"), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_custom", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id", ondelete="CASCADE"),
                  primary_key=True),
        sa.Column("permission_code", sa.String(128),
                  sa.ForeignKey("permissions.code", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "team_memberships",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("team_id", sa.Uuid(), sa.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id"), nullable=False),
        sa.Column("is_primary", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("max_concurrent_conversations", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("joined_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
        sa.UniqueConstraint("team_id", "user_id"),
    )

    op.create_table(
        "tenant_role_assignments",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("tenant_id", sa.Uuid(), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_id", sa.Uuid(), sa.ForeignKey("roles.id"), nullable=False),
    )

    op.create_table(
        "platform_users",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("platform_owner", "platform_admin", "system_operator",
                                  "support_engineer", name="platform_role"), nullable=False),
        sa.Column("mfa_enabled", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(),
                  onupdate=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("platform_users")
    op.drop_table("tenant_role_assignments")
    op.drop_table("team_memberships")
    op.drop_table("role_permissions")
    op.drop_table("roles")
    op.drop_table("permissions")
    op.drop_table("users")
    op.drop_table("teams")
    op.drop_table("tenants")
    op.drop_table("plans")
    sa.Enum(name="platform_role").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="user_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="team_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="tenant_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="tenant_type").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="role_scope").drop(op.get_bind(), checkfirst=True)
