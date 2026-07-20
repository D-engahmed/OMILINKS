"""Subscription plan model (ch.24 / ch.25)."""

import uuid

from sqlalchemy import Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tier: Mapped[str] = mapped_column(String(64), nullable=False)
    seat_limit: Mapped[int] = mapped_column(Integer, default=5)
    ai_credit_allocation: Mapped[int] = mapped_column(Integer, default=0)
