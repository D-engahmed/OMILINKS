"""FastAPI auth dependencies: JWT verification, request context, require() guard."""

from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError as _JWTError
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.context import RequestContext
from app.core.jwt import decode_token
from app.db.session import get_db
from app.domains.access.services.permission_resolver import resolve_context

bearer_scheme = HTTPBearer(auto_error=False)


async def get_request_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> RequestContext:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    token = credentials.credentials
    try:
        # plane comes from header hint (X-Plane) or is tenant by default
        plane = request.headers.get("X-Plane", "tenant")
        payload = decode_token(token, plane)
    except _JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from None

    if payload.get("plane") != plane:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Plane mismatch")

    # Set RLS context for the DB session (ch.13 R-05)
    await db.execute(
        text("SELECT set_config('app.tenant_id', :tid, true)"),
        {"tid": str(payload["tenant_id"])},
    )

    ctx = await resolve_context(
        db, UUID(payload["sub"]), UUID(payload["tenant_id"])
    )
    request.state.ctx = ctx
    return ctx


def require(permission: str, team_id: UUID | None = None):
    """Dependency factory: enforces a permission at request time (ch.13 §7.2).

    Usage: `@router.get("/", dependencies=[Depends(require("team.view.all"))])`
    """

    def checker(ctx: RequestContext = Depends(get_request_context)) -> RequestContext:
        if not ctx.can(permission, team_id):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return ctx

    return checker
