# OMILINKS

Multi-channel AI support platform — redesigned from the original NXG/MedixAi build.
This repository now contains the **actual implementation**, driven by the architecture
docs under [`docs/`](docs/) (BRD / PRD / SAD / SRS).

> The docs describe a 3-plane model (Platform / Tenant / Customer), a `tenant → teams →
> users → roles` hierarchy, permission-based RBAC with 6 system role templates, and an
> ingestion pipeline (channels → webhooks → Kafka → AI engine). See
> [`docs/13-tenancy-teams-access-control.md`](13-tenancy-teams-access-control.md) and the
> SAD container/domain chapters for the authoritative design.

## Stack

| Layer | Tech |
|---|---|
| API | FastAPI (Python 3.12), SQLAlchemy 2.0 async |
| DB | PostgreSQL 16 + Row-Level Security (per-tenant `tenant_id`) |
| Cache / Queue / Blacklist | Redis 7 |
| Vector store (RAG) | Qdrant |
| Streaming (ingestion) | Kafka |
| Frontend | Next.js 15, React 19, Tailwind, Zustand |
| Infra | Docker Compose (postgres, redis, qdrant, zookeeper, kafka, backend, frontend) |

## Repo layout

```
OMILINKS/
├── backend/                 # FastAPI service
│   ├── app/
│   │   ├── core/            # config, security (bcrypt), JWT, request context
│   │   ├── db/              # engine, session, base, sa_enum helper
│   │   ├── domains/
│   │   │   ├── tenants/     # tenant / team / user models, provisioning
│   │   │   ├── access/      # RBAC: roles, permissions, resolver, seed
│   │   │   └── platform/    # platform-plane users (separate from tenant RBAC)
│   │   ├── events/          # Kafka producer + consumer (ingestion)
│   │   └── main.py          # app factory
│   ├── migrations/          # Alembic
│   ├── pyproject.toml       # uv-managed deps
│   └── .env                 # local settings (gitignored)
├── frontend/                # Next.js app (src/app, src/store, src/lib)
├── infra/                   # docker-compose.yml, Dockerfiles
└── docs/                    # BRD / PRD / SAD / SRS (the spec this code implements)
```

## Quick start (local)

### Backend
```bash
cd backend
uv venv && uv pip install -e ".[dev]"
cp .env .env.local          # edit DATABASE_URL / REDIS_URL as needed
alembic upgrade head        # create schema
python -m app.domains.access.services.seed_cli   # seed 67 perms + 6 role templates
uvicorn app.main:app --reload
```
Health: `GET http://localhost:8000/health`

### Provision a tenant (ch.13 §8.1)
```bash
curl -X POST localhost:8000/tenants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme","slug":"acme","email":"admin@acme.com","type":"startup"}'
```
This creates the tenant, a default team `General`, and the first user as **Tenant Admin +
Team Admin**. Login at `POST /auth/login` to get a plane=`tenant` JWT.

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```
The Zustand `useAuthStore` (src/store/auth.ts) holds the JWT and exposes `apiFetch`.

### Full stack via Docker
```bash
docker compose -f infra/docker-compose.yml up -d
```
Brings up postgres, redis, qdrant, kafka, backend (:8000) and frontend (:3000).

## Authorization model (summary)

- Permissions are **codes** (`conversation.reply`, `team.manage.all`, …) — never role names.
- A user's effective permissions = **union** of tenant-scope role + each team-membership role.
- `.team` permissions are scoped to the teams the user belongs to; `.all` is tenant-wide.
- JWTs carry `plane` (`tenant` | `platform`) and are verified against separate secrets;
  tenant tokens can never reach platform endpoints.
- Permissions are resolved at request time and cached in Redis (TTL 5 min, ch.13 §7.2).

See `backend/app/domains/access/services/permission_resolver.py` and `core/auth.py`.

## Status

- **Done:** tenancy + RBAC domains (models, provisioning, permission resolution, JWT auth),
  Alembic init migration, RBAC seed, Kafka ingestion scaffold, frontend skeleton,
  Docker Compose.
- **Next:** conversations/contacts ingestion domain, AI decision engine (ch.19/29),
  billing (Paymob), analytics, and the agent dashboard UI.
