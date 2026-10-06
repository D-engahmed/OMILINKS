# Engineering Foundation

### OML-T0001 — Repository module boundaries

**Status:** BASELINE

**Evidence:** `packages/backend/src/foundation.test.ts` enforces pg-driver
confinement, domain-layer purity, and provider-gateway hiding behind
`ai/provider-resolver.ts`. Verified green on memory suite; PG variants run in CI.

**Dependencies:** OML-T0000

**Outcome:** Explicit API/worker/domain/infrastructure/shared ownership and import direction.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0002 — Configuration and environment validation

**Status:** BASELINE

**Evidence:** `config.ts` fail-fast validation with `auth.test.ts` coverage
(prod refuses dev provider, unknown providers rejected); `server.ts`/`worker.ts`
refuse to boot without `DATABASE_URL` in production; provider keys referenced
by `credentialRef`, never stored; adapter error redaction covered in `ai.test.ts`.

**Dependencies:** OML-T0001

**Outcome:** Fail-fast required configuration; distinct dev/test/prod contracts; no secret leakage.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0003 — Database migration system

**Status:** BASELINE

**Evidence:** `infrastructure/migrate.ts` (advisory lock + `schema_migrations`
ledger, lexical order); `migrate-cli.ts`; `0001-0010` migrations; idempotent-runner
coverage in `postgres.test.ts` (executes in CI against PG 16).

**Dependencies:** OML-T0001

**Outcome:** Versioned migrations; fresh-database bootstrap; CI migration validation.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0004 — Structured logging and correlation

**Status:** BASELINE

**Evidence:** `shared/logger.ts` (single-line JSON, service identity, error
serialization without stacks/secrets) wired into `server.ts`, `worker.ts`,
`node-server.ts` (requestId), `event-runtime.ts`, `migrate-cli.ts`; log-shape
tests in `foundation.test.ts`. HTTP/async correlation via `x-request-id` and
outbox `correlationId`/`causationId` (covered in `app.test.ts`, phase-5 tests).

**Dependencies:** OML-T0002

**Outcome:** Structured logs and request/correlation identity across HTTP and async work.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0005 — Test harness and CI gates

**Status:** BASELINE

**Evidence:** `test-support.ts` memory/Postgres parity harness (`storeTest`);
CI gates `backend.yml` (lint/typecheck/test on memory+PG/ build),
`widget.yml`, `web.yml`; TAP output with reproducible failure detail.

**Dependencies:** OML-T0003, OML-T0004

**Outcome:** Clean lint, typecheck, test, and build gates with reproducible failure output.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0006 — Local development infrastructure

**Status:** BASELINE

**Evidence:** `docker-compose.yml` (PostgreSQL 16 + healthcheck);
`.env.example` (DATABASE_URL/TEST_DATABASE_URL/ports/API URL);
`db:migrate` / `db:seed` scripts with idempotent `seed-dev.ts` demo tenant
through the real Application path. Reset = `compose down -v` + migrate.
Redis deliberately absent: no consumer needs it (leases/queues/dedupe are
PostgreSQL-backed); add it with the first cache/rate-limit consumer.

**Dependencies:** OML-T0003, OML-T0005

**Outcome:** Reproducible PostgreSQL/Redis environment and reset/reseed workflow.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Foundation: engineering effort and infrastructure choices consume launch cash; record delivery-cost implications.

Before marking any ticket in this track DONE, document:

- expected one-time engineering cost;
- expected recurring infrastructure/provider cost;
- variable cost created per customer, conversation, message, run, or action where applicable;
- failure/retry behavior that could duplicate cost or revenue;
- observability required to measure the economic effect;
- which finance ticket or model output consumes the evidence.

Required chain: specification -> implementation -> tests -> measured evidence -> financial effect -> management decision. See [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).
