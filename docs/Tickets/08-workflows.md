# Workflows

### OML-T0701 — Workflow definition and versioning

**Status:** BASELINE

**Dependencies:** OML-T0610

**Outcome:** Immutable published definitions and explicit entry steps.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0702 — Durable workflow run and step state

**Status:** BASELINE

**Dependencies:** OML-T0701

**Outcome:** Restart-safe run/step state and durable transitions.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0703 — Idempotent workflow triggers

**Status:** BASELINE

**Dependencies:** OML-T0702

**Outcome:** Duplicate triggers resolve to one logical run.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0704 — Workflow run leases and claiming

**Status:** BASELINE

**Dependencies:** OML-T0702, OML-T0503

**Outcome:** Single-worker ownership and safe lease recovery.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0705 — Workflow retries and failure branches

**Status:** BASELINE

**Dependencies:** OML-T0704

**Outcome:** Bounded persisted retries and explicit failure paths.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0706 — Durable WAIT and scheduler resume

**Status:** BASELINE

**Dependencies:** OML-T0705

**Outcome:** Wait state survives failure and resumes idempotently.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0707 — Durable approval state

**Status:** BASELINE

**Dependencies:** OML-T0706, OML-T0106

**Outcome:** Authorization, action hash, expiry, and durable approval resolution.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0708 — Workflow cancellation

**Status:** BASELINE

**Dependencies:** OML-T0707

**Outcome:** Durable cancellation prevents future unsafe work acquisition.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0709 — Workflow graph validation

**Status:** BASELINE

**Dependencies:** OML-T0701

**Outcome:** Reject unsupported cycles, unreachable nodes, and invalid references.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0710 — Workflow worker and scheduler integration

**Status:** BASELINE

**Dependencies:** OML-T0704, OML-T0706, OML-T0708

**Outcome:** Workflow execution integrated with shared worker runtime.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0711 — Workflow side-effect and action steps

**Status:** DEFERRED

**Dependencies:** OML-T0610, OML-T0707

**Outcome:** Authorized, entitlement-gated, idempotent external side effects with reconciliation.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0712 — Workflow compensation execution

**Status:** DEFERRED

**Dependencies:** OML-T0711

**Outcome:** Explicit compensation semantics and durable compensation failure.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0713 — Workflow parallel fan-out and fan-in

**Status:** DEFERRED

**Dependencies:** OML-T0710

**Outcome:** Bounded branch concurrency and deterministic joins.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0714 — Distributed cron triggers

**Status:** DEFERRED

**Dependencies:** OML-T0710

**Outcome:** Idempotent scheduling across multiple scheduler instances.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Workflows: execution volume and side effects create variable cost; idempotency prevents duplicate billable work.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).
