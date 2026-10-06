# AI Platform

### OML-T0601 — AI model registry

**Status:** BASELINE

**Dependencies:** OML-T0509

**Outcome:** Durable model/provider metadata with credential references and pricing metadata.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0602 — Versioned model policy and deterministic failover

**Status:** BASELINE

**Dependencies:** OML-T0601

**Outcome:** Policy-driven model selection and deterministic provider fallback.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0603 — AI agent identity and governance

**Status:** BASELINE

**Dependencies:** OML-T0106, OML-T0601

**Outcome:** Org-scoped agents with versioned governance and no privilege inheritance.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0604 — Agent execution policy

**Status:** BASELINE

**Dependencies:** OML-T0603, OML-T0602

**Outcome:** Explicit autonomy, retrieval, history, budget, and guardrail controls.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0605 — AI input/output guardrails

**Status:** BASELINE

**Dependencies:** OML-T0604

**Outcome:** Independent safety checks with block/handoff outcomes and traceability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0606 — Durable AI run traceability and cost attribution

**Status:** BASELINE

**Dependencies:** OML-T0604, OML-T0605

**Outcome:** Persist agent/policy/model/usage/cost and provider failure outcomes.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0607 — AI evaluation kernel and regression evidence

**Status:** BASELINE

**Dependencies:** OML-T0606

**Outcome:** Versioned evaluation datasets/metrics and regression promotion.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0608 — Authenticated AI APIs

**Status:** BASELINE

**Dependencies:** OML-T0603, OML-T0606, OML-T0607

**Outcome:** Scoped AI configuration, execution, and evaluation APIs.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0609 — Governed context assembly

**Status:** BASELINE

**Dependencies:** OML-T0604, OML-T0608

**Outcome:** Authorized tenant context with explicit history/knowledge budgets and prompt versioning.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0610 — Tool runtime authorization kernel

**Status:** BASELINE

**Dependencies:** OML-T0605, OML-T0609

**Outcome:** Registry/schema/scope/auth/entitlement/risk/idempotency checks before tool execution.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0611 — Embedding provider registry

**Status:** DEFERRED

**Dependencies:** OML-T0607

**Outcome:** Provider-neutral embeddings with versioned credentials and reproducible migration.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0612 — Advanced quality-based model routing

**Status:** DEFERRED

**Dependencies:** OML-T0602, OML-T0607

**Outcome:** Quality/latency/cost routing without bypassing hard policy gates.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0613 — Multi-agent orchestration

**Status:** DEFERRED

**Dependencies:** OML-T0610

**Outcome:** Explicit inter-agent authorization, shared budget propagation, and recursion limits.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

AI platform: model routing, usage limits, guardrails, fallback, and traceability are direct COGS controls and margin controls.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. Every ticket must be executed through discovery, design, implementation, evidence, and explanation.

## Mandatory pre-work

Read the linked source documents and inspect current code/tests. Record current behavior, target behavior, contradictions, assumptions, dependencies, and what is explicitly out of scope. Do not infer implementation status from documentation alone.

### OML-T0601 — AI model registry / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0602 — Versioned model policy and deterministic failover / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0603 — AI agent identity and governance / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0604 — Agent execution policy / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0605 — AI input/output guardrails / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0606 — Durable AI run traceability and cost attribution / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0607 — AI evaluation kernel and regression evidence / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0608 — Authenticated AI APIs / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0609 — Governed context assembly / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0610 — Tool runtime authorization kernel / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0611 — Embedding provider registry / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0612 — Advanced quality-based model routing / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

### OML-T0613 — Multi-agent orchestration / execution record

**Business/operational problem:** define the failure or lost value this ticket addresses.

**Scope boundary:** list in-scope behavior and explicit non-goals.

**Dependency verification:** inspect every dependency and prove the required preconditions exist.

**Domain contract:** define entities/aggregates, invariants, state machine, ownership, authority, and forbidden states.

**Interface contract:** define API/event/worker/provider/UI contracts, schemas, versioning, errors, retries, and compatibility.

**Persistence contract:** define tables, keys, uniqueness, indexes, transaction boundaries, migration sequencing, retention, and rollback/forward compatibility.

**Security contract:** define actor, tenant/scope, authorization decision, secret/data classification, abuse cases, audit evidence, and least privilege.

**Reliability contract:** define idempotency boundary, concurrency races, leases/locks/version checks, timeout behavior, duplicate delivery, replay, dead-letter, reconciliation, and unknown external outcomes as applicable.

**Testing contract:** cover happy path, negative path, boundary values, concurrency, idempotency, failure injection, migration, recovery, adapter/provider behavior, and production-database parity where applicable.

**Observability contract:** define logs, metrics, correlation/causation, latency, error taxonomy, saturation, cost counters, and the exact evidence needed during incident investigation.

**Capacity contract:** state expected volume, latency/SLA, resource budget, concurrency limits, back-pressure behavior, and scaling trigger.

**Financial contract:** identify build cost, recurring cost, variable cost per customer/message/run/action, revenue leakage risk, retry/failure cost, and downstream finance metric/report.

**Documentation contract:** identify every affected document. Behavior changes are not complete until architecture, requirements, domain, API/event, product, security, data, engineering, and ticket docs are synchronized where relevant.

**Acceptance evidence:** provide exact commands, outputs, traces, fixtures, screenshots, measured cost/revenue values, reconciliation evidence, and review notes.

**Engineer explanation:** explain why the design exists, what alternatives were rejected, what can fail, and how the evidence proves correctness without relying on the patch itself.

## No copy/paste implementation rule

Before coding, write a compact design note: current state, desired state, invariants, sequence/state diagram when useful, data changes, failure matrix, test matrix, observability plan, cost/revenue impact, and acceptance-evidence plan. AI may assist implementation, but the engineer must own and explain the design.

## DONE gate

DONE requires specification, implementation, positive tests, negative tests, failure handling, observability, migration safety, recovery, documentation synchronization, review, CI, and acceptance evidence. Documentation/code contradictions block completion until explicitly resolved.