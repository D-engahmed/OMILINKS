"""JWT issuance/verification. Separate issuers + secrets per plane (ch.13 §7.1)."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import jwt as _jose_jwt

from app.core.config import settings

Plane = Literal["tenant", "platform"]


def _secret_for(plane: Plane) -> str:
    return (
        settings.jwt_tenant_secret
        if plane == "tenant"
        else settings.jwt_platform_secret
    )


def create_access_token(
    *,
    subject: str | uuid.UUID,
    plane: Plane,
    tenant_id: str | uuid.UUID | None = None,
    token_version: int = 1,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(subject),
        "plane": plane,
        "token_version": token_version,
        "iat": now,
        "exp": now + timedelta(seconds=settings.access_token_ttl),
    }
    if tenant_id is not None:
        payload["tenant_id"] = str(tenant_id)
    return _jose_jwt.encode(payload, _secret_for(plane), algorithm=settings.jwt_algorithm)


def decode_token(token: str, plane: Plane) -> dict:
    return _jose_jwt.decode(token, _secret_for(plane), algorithms=[settings.jwt_algorithm])
