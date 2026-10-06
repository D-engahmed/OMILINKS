# Event and Worker Runtime

### OML-T0501 — PostgreSQL outbox publisher

**Status:** BASELINE

**Dependencies:** OML-T0207

**Outcome:** Durable asynchronous publication with retry-safe progress.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0502 — Per-consumer event inbox

**Status:** BASELINE

**Dependencies:** OML-T0501

**Outcome:** Consumer-local dedupe and durable retry state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0503 — Leased work claiming

**Status:** BASELINE

**Dependencies:** OML-T0502

**Outcome:** Exclusive durable worker leases with reclaim after expiry.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0504 — Retry and dead-letter transitions

**Status:** BASELINE

**Dependencies:** OML-T0503

**Outcome:** Persisted backoff/retry counts and terminal dead-letter state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0505 — Authorized dead-letter replay

**Status:** BASELINE

**Dependencies:** OML-T0504, OML-T0106

**Outcome:** Permission-gated replay with causation traceability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0506 — Worker-instance leases and heartbeats

**Status:** BASELINE

**Dependencies:** OML-T0503

**Outcome:** Durable worker liveness and safe lease expiration.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0507 — Per-class concurrency limits

**Status:** BASELINE

**Dependencies:** OML-T0506

**Outcome:** Bounded concurrency and starvation-aware scheduling.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0508 — Production worker process entrypoint

**Status:** BASELINE

**Dependencies:** OML-T0501, OML-T0506

**Outcome:** Independent worker process with deterministic startup/shutdown.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0509 — Asynchronous routing worker

**Status:** BASELINE

**Dependencies:** OML-T0508, OML-T0409

**Outcome:** Routing executes outside HTTP and remains traceable/recoverable.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0510 — Event-runtime failure and recovery tests

**Status:** BASELINE

**Dependencies:** OML-T0504, OML-T0505, OML-T0509

**Outcome:** Duplicate, crash, retry, DLQ, and replay recovery tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Event runtime: retries, leases, duplicate delivery, and queue capacity can create hidden compute/API cost and operational labor.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. The following contract is mandatory for every ticket and every engineer executing it.

## 1. Discovery before implementation

Before writing code, inspect the referenced requirements, architecture, domain, API/event, security, data, engineering, and product documents. Compare them to the current code and tests. Record contradictions, missing contracts, and implementation-vs-target differences. Never silently resolve a documentation contradiction in code.

## 2. Per-ticket specification record


### OML-T0501 — PostgreSQL outbox publisher / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0502 — Per-consumer event inbox / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0503 — Leased work claiming / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0504 — Retry and dead-letter transitions / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0505 — Authorized dead-letter replay / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0506 — Worker-instance leases and heartbeats / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0507 — Per-class concurrency limits / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0508 — Production worker process entrypoint / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0509 — Asynchronous routing worker / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

### OML-T0510 — Event-runtime failure and recovery tests / execution record

**Problem statement:** What operational/business failure exists without this capability?

**Scope:** State exactly what changes and what is explicitly out of scope.

**Dependencies:** Verify each listed dependency by inspecting its implementation and tests; do not trust the status label alone.

**Domain contract:** Identify aggregate/entity/value objects, invariants, state transitions, ownership, and authoritative source of truth.

**Interface contract:** Identify affected API endpoints, events, commands, adapters, worker jobs, UI states, and versioning rules. Define request/response/error semantics before coding.

**Persistence:** Identify tables/indexes/constraints, transaction boundaries, migration order, retention, and rollback/forward-compatibility requirements.

**Authorization/security:** Define actor, organization/scope, permitted action, deny behavior, audit requirements, secret handling, and abuse cases.

**Concurrency/idempotency:** Define idempotency key, uniqueness boundary, race windows, locking/versioning, retry semantics, and duplicate side-effect protection.

**Failure/recovery:** Define timeouts, provider failures, partial commits, worker loss, stale state, dead letters, replay, reconciliation, and unknown external outcomes where applicable.

**Testing:** Require happy-path, negative-path, boundary, concurrency, idempotency, migration, recovery, and production-adapter tests. Prefer memory/PostgreSQL parity where the repository supports it.

**Observability:** Define structured events/logs, correlation/causation identifiers, metrics, latency, error classes, saturation, and evidence needed to diagnose production incidents.

**Performance/capacity:** State expected volume, latency/SLA target, query/transaction budget, concurrency limit, and the signal that justifies scaling or adding infrastructure.

**Financial impact:** Record one-time engineering cost, recurring infrastructure cost, variable cost per billable unit, potential revenue leakage, failure/retry cost, and which finance ticket/report consumes the evidence.

**Documentation impact:** List every document that becomes stale if this ticket changes behavior. Update those documents in the same delivery slice.

**Acceptance evidence:** Attach exact test commands/results, migration evidence, traces/log examples, measured metrics, screenshots where UI applies, and reconciliation results.

**Engineer explanation:** Before DONE, explain the ticket without reading the patch: why the design is this way, what alternatives were rejected, what can fail, and how the evidence proves correctness.

## 3. No-code-first shortcut rule

Do not begin with implementation. First produce a compact design note containing: current-state evidence, desired-state contract, invariants, sequence/state diagram where useful, data changes, failure matrix, test matrix, observability plan, financial impact, and acceptance evidence plan. Only then implement.

## 4. Definition of DONE

A ticket reaches DONE only when specification, implementation, positive tests, negative tests, failure handling, observability, migration safety, recovery behavior, documentation synchronization, review, CI, and acceptance evidence all agree. If documentation and code disagree, the ticket is BLOCKED until the source of truth is explicitly updated.