# Quality

### OML-T0801 — Versioned quality scorecards

**Status:** BASELINE

**Dependencies:** OML-T0710

**Outcome:** Immutable published scorecards and durable calculation policy.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0802 — Deterministic quality sampling

**Status:** BASELINE

**Dependencies:** OML-T0801

**Outcome:** Versioned, idempotent sampling rules.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0803 — Quality evaluation state machine

**Status:** BASELINE

**Dependencies:** OML-T0802

**Outcome:** Explicit review lifecycle with guarded transitions.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0804 — Conversation-scoped evaluation evidence

**Status:** BASELINE

**Dependencies:** OML-T0803

**Outcome:** Every finding references organization-safe conversation evidence.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0805 — Reproducible scoring calculation

**Status:** BASELINE

**Dependencies:** OML-T0804

**Outcome:** Results reproducible from stored scorecard version.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0806 — AI proposal fencing

**Status:** BASELINE

**Dependencies:** OML-T0805, OML-T0607

**Outcome:** AI evaluations remain proposals until authorized completion.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0807 — Finding-linked remediation workflow

**Status:** BASELINE

**Dependencies:** OML-T0806

**Outcome:** Guarded remediation lifecycle linked to findings.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0808 — Quality kernel parity and negative tests

**Status:** BASELINE

**Dependencies:** OML-T0807

**Outcome:** Memory/PostgreSQL parity and negative regression coverage.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0809 — Quality analytics and calibration

**Status:** DEFERRED

**Dependencies:** OML-T0808

**Outcome:** Analytics/calibration added only when review volume justifies them.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Quality: QA evidence must connect to resolution rate, handoff reduction, retention, and support cost without creating unbounded review cost.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. Every ticket must be executed through discovery, design, implementation, evidence, and explanation.

## Mandatory pre-work

Read the linked source documents and inspect current code/tests. Record current behavior, target behavior, contradictions, assumptions, dependencies, and what is explicitly out of scope. Do not infer implementation status from documentation alone.

### OML-T0801 — Versioned quality scorecards / execution record

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

### OML-T0802 — Deterministic quality sampling / execution record

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

### OML-T0803 — Quality evaluation state machine / execution record

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

### OML-T0804 — Conversation-scoped evaluation evidence / execution record

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

### OML-T0805 — Reproducible scoring calculation / execution record

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

### OML-T0806 — AI proposal fencing / execution record

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

### OML-T0807 — Finding-linked remediation workflow / execution record

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

### OML-T0808 — Quality kernel parity and negative tests / execution record

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

### OML-T0809 — Quality analytics and calibration / execution record

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