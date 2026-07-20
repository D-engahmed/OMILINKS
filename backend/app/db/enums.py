"""Shared SQLAlchemy Enum helper: always persist the enum `.value` (not `.name`)."""

from enum import Enum

from sqlalchemy import Enum as SQLEnum


def sa_enum(enum_cls: type[Enum], name: str | None = None) -> SQLEnum:
    return SQLEnum(
        enum_cls,
        name=name,
        values_callable=lambda e: [member.value for member in e],
    )
