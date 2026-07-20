"""FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.domains.access.routes.access import router as access_router
from app.domains.tenants.routes.auth import router as auth_router
from app.domains.tenants.routes.team import router as team_router
from app.domains.tenants.routes.tenant import router as tenant_router
from app.domains.tenants.routes.user import router as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.events.consumer import start_consumer

    task = await start_consumer()
    yield
    if task:
        task.cancel()


def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.app_name} API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok", "service": settings.app_name}

    # Domain routers — each has its own prefix
    app.include_router(auth_router)      # /auth/login, /auth/register
    app.include_router(tenant_router)    # /tenants/me, /tenants/me/usage
    app.include_router(team_router)      # /teams, /teams/{id}, /teams/{id}/members
    app.include_router(user_router)      # /users, /users/invites, /users/{id}
    app.include_router(access_router)    # /access/roles, /access/permissions

    return app


app = create_app()
