# Omnilinks Backend

FastAPI + SQLAlchemy 2.0 async backend for the Omnilinks multi-channel AI support platform.

## Stack
- **API:** FastAPI (Python 3.12)
- **DB:** PostgreSQL 16 (asyncpg) with Row-Level Security per tenant
- **Cache / Queue:** Redis 7
- **Vector store:** Qdrant (RAG)
- **Streaming:** Kafka (channel ingestion pipeline)

## Layout
- `app/core` — config, security, JWT, request context
- `app/db` — engine, session, base
- `app/domains/tenants` — tenant / team / user models, provisioning
- `app/domains/access` — RBAC (roles, permissions, resolver)
- `app/domains/platform` — platform-plane users
- `app/events` — Kafka producer / consumer

## Dev
```bash
uv venv && uv pip install -e ".[dev]"
cp .env.example .env   # or use .env
uvicorn app.main:app --reload
```

## Migrations
```bash
alembic upgrade head
```

## Seed RBAC
```bash
curl -X POST localhost:8000/tenants/seed   # requires role.manage; or call seed_rbac()
```
