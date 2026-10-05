# OMILINKS Engineering Documentation

> **Role:** system operating specification and implementation memory  
> **Status:** target architecture / contracts; implementation status must be verified from code and tests

## 1. Documentation Philosophy

These documents are intentionally written as implementation specifications rather than feature descriptions.

A substantive design should answer:

~~~text
what is owned?
what is the invariant?
what is the state machine?
what is the data model?
what is the API/event contract?
what happens under concurrency?
what happens when dependencies fail?
how is it secured?
how is it observed?
how is it tested?
how is it recovered?
~~~

Documentation existence does not imply implementation existence.

## 2. Authority Order

When artifacts conflict:

1. platform security and tenant-isolation invariants;
2. product/functional requirements;
3. domain invariants;
4. API/event compatibility;
5. architecture decisions;
6. implementation convenience.

## 3. Documentation Map

| Area | Purpose |
|---|---|
| requirements | behavior and measurable quality targets |
| architecture | system structure and deployment boundaries |
| architecture/decisions | durable architectural decisions |
| domain | aggregates, invariants and state transitions |
| api | wire-level client contracts |
| events | asynchronous contracts/reliability |
| integrations | provider adapter behavior |
| ai | execution, routing, guardrails, evaluation and economics |
| security | threat/control model |
| data | persistence, consistency, retention, recovery |
| product | UX and screen behavior |
| engineering | coding, Git, testing, release |
| engineering/traceability | requirement-to-evidence chain |

## 4. Architecture Spine

~~~mermaid
flowchart TB
REQ[Requirements] --> DOMAIN[Domain Invariants]
DOMAIN --> API[API Contracts]
DOMAIN --> EVT[Event Contracts]
EVT --> WORK[Async Workers]
DOMAIN --> DATA[Transactional Data]
WORK --> AI[AI Runtime]
WORK --> INT[Integrations]
AI --> TOOLS[Tool Runtime]
INT --> EXT[External Providers]
SEC[Security] -. governs .-> DOMAIN
BILL[Billing] -. gates .-> AI
OBS[Observability] -. traces .-> ALL[Critical Paths]
TEST[Testing] --> RELEASE[Release]
~~~

## 5. Current Architecture Decision Set

The current ADR set records:

- modular monolith first;
- PostgreSQL as transactional source of truth;
- transactional outbox / at-least-once events;
- tenant isolation at repository boundary;
- AI cannot bypass Tool/Domain boundaries.

These decisions may be superseded, but they should never disappear silently from history.

## 6. Cross-Cutting Invariants

### Tenant isolation

Every tenant-owned resource is resolved inside known organization/scope context.

### Authorization

Frontend state and model output never grant permission.

### Idempotency

Retry-sensitive operations define duplicate behavior.

### Durability

Work that must survive process restart is persisted.

### Versioning

Published contracts remain stable or change explicitly.

### Observability

Important work propagates request/correlation/causation identity.

### Recovery

Unknown external outcomes are reconciled rather than blindly retried.

## 7. Engineering Traceability

The intended chain is:

~~~text
Requirement ID
 -> Domain Rule
 -> API/Event Contract
 -> Implementation
 -> Test
 -> Runtime Evidence
 -> Acceptance
~~~

The traceability matrix is the control point for production readiness.

## 8. Event Schema Registry

The schema directory contains concrete v1 JSON Schemas and fixtures.

Schemas currently include:

- common event envelope;
- conversation.message.received;
- ai.run.completed;
- subscription.changed;
- usage.recorded.

Production event types should follow the same versioning/fixture pattern.

## 9. AI Engineering Contract

The AI documentation is intentionally split:

~~~text
docs/ai/
  agent-runtime
  model-routing
  tool-runtime
  guardrails
  evaluation
  cost-control
~~~

This separates execution, routing, authorization, safety, evaluation and economics instead of turning "AI" into one giant module.

## 10. Implementation Reality

Implementation is incremental and phase-gated.

Current verified runtime slices are:
- tenancy/identity/customer/conversation/workforce foundation;
- Phase 2 conversation core and initial governed AI pipeline;
- Phase 3 Web Widget channel ingress and provider-event ledger;
- Phase 4 workforce state, deterministic routing, queues, policy versions, and assignment commit safety;
- Phase 5 PostgreSQL-backed outbox/event-inbox worker runtime with retries, leases, dead-letter replay, and queue routing;
- Phase 6 AI control plane: model registry/failover, guardrails, durable AI traceability, cost attribution, and evaluation;
- Phase 7 durable workflow engine: versioned definitions, idempotent triggers, run leases, WAIT/APPROVAL states, bounded retries, and scheduler resume (kernel step types only; no side-effect steps yet);
- Phase 8 quality kernel: versioned scorecards, deterministic sampling, versioned human review with conversation-scoped evidence, reproducible scores, AI-proposal fencing, and finding-linked remediations (calibration/analytics deferred);
- Operator inbox slice in `apps/web`: authenticated shell, enriched `GET /api/v1/inbox`, conversation detail with polling, handoff visibility, idempotent human reply, and claim via assignments (polling first; realtime deferred).

The rest of the domain architecture remains target until implementation and automated evidence exist.

Do not use documentation alone as evidence that a subsystem is running in production.

## 11. Change Rule

Update documentation when a change affects:

- behavior;
- domain invariants;
- data model;
- API;
- event schemas;
- authorization;
- tenant isolation;
- AI autonomy;
- tools;
- billing;
- deployment/recovery;
- observable failure behavior.

## 12. Standard for a Production-Ready Feature

~~~text
specification
+
implementation
+
negative tests
+
failure handling
+
observability
+
migration safety
+
recovery
+
release evidence
~~~

A feature is not production-ready merely because the happy path works.
