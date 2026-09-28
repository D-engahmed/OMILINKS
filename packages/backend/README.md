# @workspace/backend

The OmniLinks backend lives in packages/backend as a workspace package.

## Current state

The current implementation is a small Node HTTP runtime with:
- /health
- /api/v1

It is intentionally only the scaffold.

## Target responsibility

The backend will own:
- authentication context
- tenant resolution
- authorization
- domain use cases
- transactional persistence
- events/jobs
- AI orchestration
- channel processing
- workflows
- billing
- audit

## Rules

- applications do not import backend internals
- routes remain thin
- domain modules own business rules
- provider SDKs stay behind adapters
- PostgreSQL is the business source of truth
- tenant authorization is server-side

See docs/01-system-design.md and docs/17-repository-structure.md.
