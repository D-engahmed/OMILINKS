# Billing

### OML-T0901 — Billing domain model

**Status:** TARGET

**Dependencies:** OML-T0808

**Outcome:** Explicit ownership/invariants for plans, entitlements, subscriptions, usage, payments, invoices.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0902 — Plan catalog and versioning

**Status:** TARGET

**Dependencies:** OML-T0901

**Outcome:** Data-driven versioned prices and limits.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0903 — Entitlement resolution engine

**Status:** TARGET

**Dependencies:** OML-T0902

**Outcome:** Effective entitlements derive from authoritative subscription state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0904 — Subscription state machine

**Status:** TARGET

**Dependencies:** OML-T0903

**Outcome:** Explicit lifecycle states, legal transitions, and auditability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0905 — Immutable usage event model

**Status:** TARGET

**Dependencies:** OML-T0904

**Outcome:** Durable org-scoped usage events with idempotency identity.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0906 — Usage aggregation and metering

**Status:** TARGET

**Dependencies:** OML-T0905

**Outcome:** Reproducible billing-period aggregates without double-counting.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0907 — Payment provider abstraction

**Status:** TARGET

**Dependencies:** OML-T0904

**Outcome:** Provider-neutral payment interface and normalized provider states.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0908 — Paymob payment creation

**Status:** TARGET

**Dependencies:** OML-T0907

**Outcome:** Idempotency-aware payment initiation and provider reference persistence.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0909 — Payment webhook ingestion

**Status:** TARGET

**Dependencies:** OML-T0908, OML-T0304

**Outcome:** Validated, deduplicated provider callbacks.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0910 — Payment reconciliation

**Status:** TARGET

**Dependencies:** OML-T0909

**Outcome:** Internal/provider state reconciliation with durable mismatches.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0911 — Invoice and payment history

**Status:** TARGET

**Dependencies:** OML-T0904, OML-T0906, OML-T0910

**Outcome:** Tenant-safe historical billing records with minimal sensitive data.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0912 — Billing API and operator UI

**Status:** TARGET

**Dependencies:** OML-T0903, OML-T0911

**Outcome:** Tenant-authorized billing APIs/UI reflecting authoritative state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0913 — Billing observability and reconciliation metrics

**Status:** TARGET

**Dependencies:** OML-T0910

**Outcome:** Payment, webhook, usage, cost, and reconciliation telemetry.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0914 — Billing end-to-end and failure tests

**Status:** TARGET

**Dependencies:** OML-T0912, OML-T0913

**Outcome:** Subscribe/pay/callback/entitlement, duplicate, failure, and mismatch tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Billing: revenue recognition, entitlements, usage metering, payment collection, reconciliation, refunds, and fee accounting are financial source-of-truth concerns.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. Every ticket must be executed through discovery, design, implementation, evidence, and explanation.

## Mandatory pre-work

Read the linked source documents and inspect current code/tests. Record current behavior, target behavior, contradictions, assumptions, dependencies, and what is explicitly out of scope. Do not infer implementation status from documentation alone.

### OML-T0901 — Billing domain model / execution record

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

### OML-T0902 — Plan catalog and versioning / execution record

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

### OML-T0903 — Entitlement resolution engine / execution record

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

### OML-T0904 — Subscription state machine / execution record

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

### OML-T0905 — Immutable usage event model / execution record

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

### OML-T0906 — Usage aggregation and metering / execution record

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

### OML-T0907 — Payment provider abstraction / execution record

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

### OML-T0908 — Paymob payment creation / execution record

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

### OML-T0909 — Payment webhook ingestion / execution record

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

### OML-T0910 — Payment reconciliation / execution record

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

### OML-T0911 — Invoice and payment history / execution record

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

### OML-T0912 — Billing API and operator UI / execution record

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

### OML-T0913 — Billing observability and reconciliation metrics / execution record

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

### OML-T0914 — Billing end-to-end and failure tests / execution record

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