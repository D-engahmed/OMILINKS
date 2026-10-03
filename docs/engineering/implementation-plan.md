# Implementation Plan

> Status: **Target engineering execution plan**

## 1. Current Repository Reality

The repository is currently a scaffold:

- Next.js web shell;
- widget shell;
- thin backend HTTP handler;
- workspace/tooling configuration;
- documentation baseline.

The target domains described in these documents are not yet equivalent to implemented production subsystems.

This distinction is intentional.

## 2. Implementation Order

~~~mermaid
flowchart LR
FOUNDATION[Foundation] --> TENANCY[Tenancy + Identity]
TENANCY --> CORE[Customers + Conversations]
CORE --> WORKFORCE[Workforce + Routing]
WORKFORCE --> CHANNELS[Channels]
CORE --> EVENTS[Outbox + Event Runtime]
CHANNELS --> AI[AI Runtime + Knowledge + Tools]
AI --> WORKFLOWS[Workflows]
WORKFLOWS --> QUALITY[Quality]
QUALITY --> BILLING[Billing + Metering]
BILLING --> HARDEN[Security + DR + Production Hardening]
~~~

## 3. Phase 0 — Engineering Foundation

Implement:

- repository module boundaries;
- configuration validation;
- structured logging;
- request/correlation IDs;
- database migration system;
- test harness;
- CI gates;
- local development infrastructure.

Exit criteria:

~~~text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
~~~

all pass in clean environment.

## 4. Phase 1 — Tenancy and Identity

Implement:

- Organization;
- Membership;
- Role/Permission;
- scope bindings;
- service principals;
- tenant middleware/context;
- authorization engine;
- audit events.

Security exit criteria:

- cross-tenant reads/writes fail;
- role/scope escalation fails;
- membership revocation takes effect.

## 5. Phase 2 — Customer and Conversation Core

Implement:

- Customer;
- CustomerIdentity;
- Conversation;
- Message;
- Assignment/control;
- delivery state;
- idempotency records;
- outbox.

Exit criteria:

- duplicate inbound message is deduplicated;
- human takeover prevents stale AI send;
- message and outbox commit atomically.

## 6. Phase 3 — Channels + Webhooks

Implement one real channel end-to-end and establish the provider adapter contract.

Current implementation:
- ChannelIntegration tenant configuration;
- publishable widget key;
- allowed-origin validation;
- public widget configuration;
- public widget message ingress;
- provider-event dedupe ledger;
- retryable ingress lease;
- canonical inbound message persistence;
- integration test contract.

Exit criteria:

~~~text
provider request
 -> verify
 -> provider-event dedupe
 -> normalize
 -> canonical message
 -> transactional outbox
 -> 202 accepted
~~~

The current production-like channel is the Web Widget. Other providers are added only after satisfying the same adapter contract.

## 7. Phase 4 — Workforce and Routing

Current implementation:
- workforce member operational state;
- skills and proficiency;
- presence with TTL;
- capacity accounting;
- teams and queues;
- versioned routing policies;
- deterministic routing evaluation;
- routing decision/candidate snapshots;
- transactional routing commit;
- assignment release.

Implement:

- WorkforceMember;
- skills;
- teams;
- queues;
- presence;
- capacity;
- RoutingPolicy/version;
- RoutingDecision;
- assignment transaction;
- escalation policies.

Exit criteria:

- deterministic routing;
- no candidate -> queue;
- assignment race protection;
- human takeover is authoritative.

## 8. Phase 5 — Event and Worker Runtime

Implement:

- outbox publisher;
- event consumer;
- inbox/dedupe;
- retry queue;
- dead letters;
- worker leases;
- correlation propagation;
- per-class concurrency pools.

Exit criteria:

- duplicate event safe;
- worker crash recoverable;
- dead letter/replay works;
- webhook processing is decoupled from expensive work.

## 9. Phase 6 — AI Platform

Implement:

- AIAgent;
- versioned policy;
- context builder;
- model registry;
- model router;
- guardrails;
- tool runtime;
- AI run state;
- cost metering;
- evaluation harness;
- embeddings/vector retrieval when evidence justifies the change.

Exit criteria:

- provider failure has deterministic fallback;
- model output cannot bypass authorization;
- AI execution is durable and observable;
- retrieval quality is measured before being trusted.

## 10. Phase 7 — Workflows

Implement:

- versioned workflow definitions;
- run engine;
- step engine;
- wait state;
- approval;
- retries;
- compensation;
- recovery.

Exit criteria:

- workflow execution is resumable;
- duplicate triggers are idempotent;
- irreversible actions require explicit policy.

## 11. Phase 8 — Quality

Implement:

- sampling;
- scorecards;
- evaluation;
- evidence;
- calibration;
- remediation;
- AI quality monitoring.

Exit criteria:

- every quality score links to conversation evidence;
- sampling is reproducible;
- human and AI evaluation are distinguishable.

## 12. Phase 9 — Billing

Implement:

- plans;
- entitlements;
- subscriptions;
- Paymob adapter;
- usage meter;
- reconciliation;
- invoice/payment history.

Exit criteria:

- provider callbacks are reconciled server-side;
- entitlements are derived from authoritative subscription state;
- duplicate callbacks cannot duplicate billing effects.

## 13. Phase 10 — Production Hardening

Complete:

- security testing;
- load tests;
- backup restore drill;
- provider failover/reconciliation;
- observability dashboards;
- incident runbooks;
- release gates;
- data retention/purge.

Exit criteria:

- implementation evidence;
- operational metrics;
- failure recovery;
- security evidence;
- migration safety;
- support runbook.

## 14. Vertical Slice Rule

Do not build every table first.

Build complete vertical capabilities:

~~~text
tenant
 -> customer
 -> conversation
 -> message
 -> routing
 -> worker
 -> delivery
~~~

then harden.

This produces executable evidence early.

## 15. Definition of Production Readiness

Production readiness requires:

- implementation;
- tests;
- operational metrics;
- failure recovery;
- security evidence;
- migration safety;
- support runbook.

Documentation without executable evidence does not qualify.
