"""FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.domains.access.routes.access import router as access_router
from app.domains.tenants.routes.auth import router as auth_router
from app.domains.tenants.routes.tenant import router as tenant_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start Kafka consumer group on boot (events/consumer.py)
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

    app.include_router(auth_router)
    app.include_router(tenant_router)
    app.include_router(access_router)
    return app


app = create_app()
