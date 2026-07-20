"""Enumerations for the tenancy, teams, and access-control model (ch.13 / ch.24 / ch.25)."""

import enum


class TenantType(str, enum.Enum):
    INDIVIDUAL = "individual"
    STARTUP = "startup"
    SMALL_BUSINESS = "small_business"
    MEDIUM_BUSINESS = "medium_business"
    ENTERPRISE = "enterprise"
    NONPROFIT = "nonprofit"
    GOVERNMENT = "government"
    EDUCATION = "education"


class TenantStatus(str, enum.Enum):
    TRIAL = "trial"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class TeamStatus(str, enum.Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"


class UserStatus(str, enum.Enum):
    INVITED = "invited"
    ACTIVE = "active"
    DEACTIVATED = "deactivated"
    SUSPENDED = "suspended"


class RoleScope(str, enum.Enum):
    TENANT = "tenant"
    TEAM = "team"


class PlatformRole(str, enum.Enum):
    PLATFORM_OWNER = "platform_owner"
    PLATFORM_ADMIN = "platform_admin"
    SYSTEM_OPERATOR = "system_operator"
    SUPPORT_ENGINEER = "support_engineer"
