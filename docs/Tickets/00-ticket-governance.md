# Ticket Governance

### OML-T0000 — Ticket Operating Model

**Status:** BASELINE

**Dependencies:** None

**Outcome:** Stable IDs, ordered dependencies, standard ticket template, and issue-to-release traceability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Governance: every ticket must declare financial impact, evidence, and decision consequence.

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


### OML-T0000 — Ticket Operating Model / execution record

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