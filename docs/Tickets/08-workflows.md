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


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. Every ticket must be executed through discovery, design, implementation, evidence, and explanation.

## Mandatory pre-work

Read the linked source documents and inspect current code/tests. Record current behavior, target behavior, contradictions, assumptions, dependencies, and what is explicitly out of scope. Do not infer implementation status from documentation alone.

### OML-T0701 — Workflow definition and versioning / execution record

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

### OML-T0702 — Durable workflow run and step state / execution record

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

### OML-T0703 — Idempotent workflow triggers / execution record

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

### OML-T0704 — Workflow run leases and claiming / execution record

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

### OML-T0705 — Workflow retries and failure branches / execution record

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

### OML-T0706 — Durable WAIT and scheduler resume / execution record

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

### OML-T0707 — Durable approval state / execution record

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

### OML-T0708 — Workflow cancellation / execution record

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

### OML-T0709 — Workflow graph validation / execution record

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

### OML-T0710 — Workflow worker and scheduler integration / execution record

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

### OML-T0711 — Workflow side-effect and action steps / execution record

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

### OML-T0712 — Workflow compensation execution / execution record

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

### OML-T0713 — Workflow parallel fan-out and fan-in / execution record

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

### OML-T0714 — Distributed cron triggers / execution record

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