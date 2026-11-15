# OmniLinks API

The Python API is the target backend for OmniLinks. It is introduced alongside
the current Convex-backed web integration and will become authoritative by
domain as each capability is migrated and verified.

## Stack

- Python 3.13
- Django 6.1
- Django REST Framework 3.18
- PostgreSQL via psycopg 3
- ASGI entrypoint via Uvicorn
- Ruff for linting and formatting

## Local setup

From this directory:

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
python manage.py migrate
python manage.py test
python manage.py runserver 0.0.0.0:8000
```

For the repository's Docker development environment, run
`docker compose up --build postgres api` from the repository root.

## Health endpoints

- `GET /health/live/`: process liveness; does not depend on PostgreSQL.
- `GET /health/ready/`: readiness; returns 503 when PostgreSQL is unavailable.

## Module boundaries

Business capabilities are added under `modules/<bounded_context>/` with
`domain/`, `application/`, `infrastructure/`, `presentation/`, and
`tests/` boundaries as needed. Do not create empty layers before a real
capability needs them.

Dependency direction:

```text
presentation -> application -> domain
infrastructure -> application ports
```

Domain code must not import Django, DRF, ORM models, provider SDKs, or
infrastructure implementations. Django views and serializers translate
transport contracts; they do not own business policy.

See [the backend migration design](../../docs/architecture/backend-migration-to-django.md)
for the migration rules and cutover sequence.
