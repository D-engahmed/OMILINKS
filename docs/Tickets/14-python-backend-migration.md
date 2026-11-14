# Python Backend Migration

> Goal: replace the Convex runtime with an independently designed Django
> modular monolith without losing existing product behavior.
>
> Architecture contract:
> [Backend Migration to Django](../architecture/backend-migration-to-django.md)
> and [ADR-0006](../architecture/decisions/0006-django-backend.md).

## Ticket sequence

### OML-T1301 — Django API foundation

**Status:** IN REVIEW in PR 1

**Dependencies:** OML-T0000

**Outcome:** A runnable Django/DRF ASGI service under `services/api`, with
environment validation, safe health endpoints, PostgreSQL URL support,
Docker, and independent CI.

**Acceptance:**
- clean Python 3.13 environment installs the API;
- Django system checks and migration checks pass;
- liveness does not depend on PostgreSQL;
- readiness returns 503 on database failure without leaking connection data;
- production configuration rejects missing secret/database settings and
  refuses DEBUG;
- Docker Compose starts API and PostgreSQL;
- Python CI runs on pull requests;
- existing Next.js/Convex behavior remains unchanged.

### OML-T1302 — PostgreSQL migration and persistence baseline

**Status:** TARGET

**Dependencies:** OML-T1301

**Outcome:** Versioned Django migrations, connection policy, transaction
helpers, database observability and clean PostgreSQL bootstrap.

**Acceptance:** fresh database migration, upgrade migration, migration drift,
backup/restore smoke test and PostgreSQL integration tests pass.

### OML-T1303 — Tenancy, identity and authorization

**Status:** TARGET

**Dependencies:** OML-T1302

**Outcome:** Organization, membership, role, permission, active organization
resolution and tenant request context.

**Acceptance:** expired/revoked identity, membership revocation, cross-tenant
IDOR, role escalation, multi-membership switching and service-principal scope
tests pass. Clerk integration must validate signatures and issuer/audience;
client-provided organization IDs never establish access.

### OML-T1304 — Customer and identity domain

**Status:** TARGET

**Dependencies:** OML-T1303

**Outcome:** Tenant-scoped customer, external identity and company records.

**Acceptance:** identity normalization, duplicate merge policy, unique
constraints, tenant-scoped search and export isolation pass.

### OML-T1305 — Conversation and message core

**Status:** TARGET

**Dependencies:** OML-T1304

**Outcome:** Conversation/message aggregates, state machine, assignment control,
delivery state, idempotency and transactional outbox.

**Acceptance:** inbound duplicate, out-of-order event, concurrent takeover,
stale AI response, transaction rollback and cross-tenant access tests pass.

### OML-T1306 — Channel adapter and Web Widget migration

**Status:** TARGET

**Dependencies:** OML-T1305

**Outcome:** Provider-neutral channel contract, signed webhook ingress,
deduplication, retryable ingress and widget API migration.

**Acceptance:** duplicate webhook, invalid signature, provider timeout,
unknown outcome, origin validation and visitor/conversation isolation pass.

### OML-T1307 — Workforce and deterministic routing

**Status:** TARGET

**Dependencies:** OML-T1305

**Outcome:** Workforce member, team, queue, skill, presence, capacity,
versioned routing policy, decision evidence and transactional assignment.

**Acceptance:** deterministic candidate order, unavailable agent, capacity
race, stale presence, queue handback and takeover safety pass.

### OML-T1308 — Durable event and worker runtime

**Status:** TARGET

**Dependencies:** OML-T1302, OML-T1305

**Outcome:** Transactional outbox, per-consumer inbox, worker leases, bounded
retry, dead-letter, replay, heartbeats and per-class concurrency controls.

**Acceptance:** crash after lease, publish duplicate, worker timeout, poison
event, lease expiry and replay authorization are verified on PostgreSQL.

### OML-T1309 — AI and knowledge control plane

**Status:** TARGET

**Dependencies:** OML-T1305, OML-T1308

**Outcome:** Model registry, provider adapters, retrieval, policy snapshots,
guardrails, cost attribution, evaluation, traceability and human handoff.

**Acceptance:** provider failover, prompt injection, ungrounded answer,
cross-tenant retrieval, budget limit, tool permission denial and human takeover
are covered by regression tests.

### OML-T1310 — Workflow engine

**Status:** TARGET

**Dependencies:** OML-T1308

**Outcome:** Versioned workflow definitions, graph validation, durable run/step
state, wait, approval, retries and cancellation.

**Acceptance:** duplicate trigger, worker loss, stale approval, expiry,
unauthorized side effect and retry exhaustion pass.

### OML-T1311 — Quality and supervisor operations

**Status:** TARGET

**Dependencies:** OML-T1307, OML-T1309

**Outcome:** Versioned scorecards, reproducible sampling, evidence-linked
reviews, calibration and remediation.

**Acceptance:** immutable scorecard version, message evidence ownership,
reviewer permissions, AI proposal fencing and score reproducibility pass.

### OML-T1312 — Billing, usage and reconciliation

**Status:** TARGET

**Dependencies:** OML-T1308

**Outcome:** Plans, entitlements, subscriptions, usage ledger, Paymob adapter,
payment callbacks, invoices and reconciliation.

**Acceptance:** duplicate callbacks, out-of-order payment events, charge
reconciliation, entitlement revocation, usage replay and cost attribution pass.

### OML-T1313 — Frontend and operator cutover

**Status:** TARGET

**Dependencies:** OML-T1303 through OML-T1312 as applicable

**Outcome:** Replace frontend Convex hooks/providers with typed API clients,
authenticated session handling, API error mapping and realtime transport.

**Acceptance:** agent, tenant-admin and widget journeys pass contract tests;
no feature silently falls back to Convex; migration and rollback are rehearsed.

### OML-T1314 — Convex retirement

**Status:** TARGET

**Dependencies:** OML-T1313

**Outcome:** Remove Convex schema/functions, provider wrappers, packages,
environment variables, CI steps and deployment dependency.

**Acceptance:** repository-wide search proves no active Convex references;
data reconciliation is complete; production smoke tests and rollback plan
are signed off.
