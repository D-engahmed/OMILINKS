# Customer and Conversation Core

### OML-T0201 — Customer aggregate

**Status:** BASELINE

**Dependencies:** OML-T0107

**Outcome:** Organization-scoped durable customer identity and lifecycle.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0202 — Customer identity mapping

**Status:** BASELINE

**Dependencies:** OML-T0201

**Outcome:** External channel identities map deterministically to org-scoped customers.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0203 — Conversation aggregate and control state

**Status:** BASELINE

**Dependencies:** OML-T0201

**Outcome:** Durable conversation lifecycle and explicit human/AI control version.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0204 — Message model and delivery state

**Status:** BASELINE

**Dependencies:** OML-T0203

**Outcome:** Canonical inbound/outbound messages with extensible delivery state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0205 — Assignment and takeover transaction

**Status:** BASELINE

**Dependencies:** OML-T0203, OML-T0106

**Outcome:** Authoritative human takeover; stale AI actions rejected after control change.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0206 — Message idempotency

**Status:** BASELINE

**Dependencies:** OML-T0204

**Outcome:** Duplicate inbound delivery resolves to one canonical message.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0207 — Transactional outbox for domain events

**Status:** BASELINE

**Dependencies:** OML-T0204, OML-T0003

**Outcome:** Business state and outbox record commit atomically.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0208 — Conversation core integration tests

**Status:** BASELINE

**Dependencies:** OML-T0205, OML-T0206, OML-T0207

**Outcome:** Duplicate ingress, takeover race, and atomic outbox scenarios automated.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Conversation core: message volume, retention, handoff, and duplicate prevention directly affect variable COGS and support economics.

Before marking any ticket in this track DONE, document:

- expected one-time engineering cost;
- expected recurring infrastructure/provider cost;
- variable cost created per customer, conversation, message, run, or action where applicable;
- failure/retry behavior that could duplicate cost or revenue;
- observability required to measure the economic effect;
- which finance ticket or model output consumes the evidence.

Required chain: specification -> implementation -> tests -> measured evidence -> financial effect -> management decision. See [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).


# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. The following contract is mandatory for every ticket and every engineer executing it.

## 1. Discovery before implementation

Before writing code, inspect the referenced requirements, architecture, domain, API/event, security, data, engineering, and product documents. Compare them to the current code and tests. Record contradictions, missing contracts, and implementation-vs-target differences. Never silently resolve a documentation contradiction in code.

## 2. Per-ticket specification record


### OML-T0201 — Customer aggregate / execution record

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

### OML-T0202 — Customer identity mapping / execution record

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

### OML-T0203 — Conversation aggregate and control state / execution record

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

### OML-T0204 — Message model and delivery state / execution record

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

### OML-T0205 — Assignment and takeover transaction / execution record

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

### OML-T0206 — Message idempotency / execution record

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

### OML-T0207 — Transactional outbox for domain events / execution record

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

### OML-T0208 — Conversation core integration tests / execution record

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