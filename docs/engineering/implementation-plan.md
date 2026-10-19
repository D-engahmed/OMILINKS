# Implementation Plan

> Status: **Target engineering execution plan**

## 1. Current Repository Reality

**Blocking source-of-truth exception at reviewed snapshot.** At current default-branch commit [ea96ef4](https://github.com/D-engahmed/OMILINKS/commit/ea96ef4c811f957ea3de65fdf9331452ab187ffc), the Git tree does not contain packages/backend, even though the README, workspace CI, Docker Compose instructions, and this plan describe the backend package. The historical code-containing snapshot [58dfe38](https://github.com/D-engahmed/OMILINKS/commit/58dfe387e1fc8d8543ee2c9df4a9b369a3d4aec7) does contain that package. This appears to be a merge-tree/source-reconciliation regression; inspect and restore it through a normal PR rather than resetting or force-pushing the branch.

Accordingly, the phase descriptions below are historical/recoverable implementation evidence and target contracts until they are verified from a clean checkout of the canonical branch. A ticket marked BASELINE is not proof that the feature is present on current main, tested, or deployed. Local uncommitted work is outside this repository snapshot.

### Mandatory gate before feature work

1. Reconcile backend source and the newer documentation on a fix branch.
2. Reproduce install, lint, typecheck, build, memory-store tests, PostgreSQL integration tests, web/widget builds, and migration checks from a clean checkout.
3. Reconcile ticket status against the resulting code and test evidence.
4. Merge through review. Do not proceed to Billing on the strength of documentation alone.

Follow [Launch Strategy Review (20 October 2026)](../product/launch-strategy-review-2026-10-20.md) for the revised commercial-launch sequence. The domain dependency graph below is not a substitute for a customer-validated launch plan.

## 1A. Commercial Critical Path — Starts in Parallel

The domain phases below describe engineering dependencies, not the business launch sequence. Start prospecting and buyer discovery immediately, in parallel with Gate 0 recovery. Use [Business Execution Plan](../product/business-execution-plan-2026-10-20.md) and [OML-T1200–OML-T1211](../Tickets/13-business-validation-and-paid-pilot.md). Do not begin new channel-specific feature work until there is a credible buyer/pilot path and the canonical code baseline is reproducible. The code-recovery gate blocks software delivery, not low-cost customer discovery.

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

Current implementation:
- PostgreSQL-backed outbox publisher;
- per-consumer event inbox/fan-out;
- inbox deduplication key;
- leased work claiming with FOR UPDATE SKIP LOCKED;
- retry and dead-letter transitions;
- authorized dead-letter replay;
- worker-instance leases and heartbeats;
- correlation/causation propagation;
- per-class concurrency limits;
- production worker process entrypoint;
- first real routing worker for queue-controlled conversations.

Exit criteria:

- duplicate event safe;
- worker crash recoverable through expired inbox lease;
- dead letter/replay works;
- asynchronous routing can execute outside the HTTP request;
- PostgreSQL/RLS tests pass in both memory and production adapter paths.

Deferred until justified by scale or topology: Kafka/external broker, cross-region ordering, autoscaling, and additional AI/workflow/delivery worker classes.

## 9. Phase 6 — AI Platform

Current implementation:
- AI model registry with secret references and pricing metadata;
- ordered versioned model policies with deterministic failover;
- versioned AI agents backed by AI workforce members;
- agent execution policy with autonomy, retrieval, history, budget, and guardrail controls;
- deterministic input/output guardrails;
- durable AI run traceability for agent, policy, model, usage, and cost;
- rule-based AI run evaluation;
- authenticated AI configuration, execution, and evaluation APIs;
- PostgreSQL RLS and memory/PostgreSQL parity tests.

Exit criteria:

- provider failure has deterministic fallback;
- model output cannot bypass the existing conversation authorization boundary;
- AI execution is durable and observable;
- evaluation measures evidence characteristics before quality claims are made.

Deferred:
- tool runtime;
- multi-agent orchestration;
- embedding provider registry;
- advanced quality-based model routing.

## 10. Phase 7 — Workflows

Current implementation:

- versioned workflow definitions with explicit entry steps;
- relational workflow steps and durable run/step-run state;
- idempotent trigger dedupe;
- run leases and PostgreSQL SKIP LOCKED claiming;
- retry/backoff state and failure branches;
- durable WAIT state and scheduler resume;
- durable APPROVAL state with action hash, expiry, and authenticated resolution;
- workflow cancellation;
- workflow worker and scheduler integration with Phase 5 runtime;
- graph validation for cycles, unreachable nodes, and invalid references;
- memory/PostgreSQL parity tests.

Exit criteria:

- workflow execution is resumable;
- duplicate triggers are idempotent;
- wait and approval states survive worker loss;
- retry state is durable and bounded;
- irreversible side-effect steps remain absent until their authorization and idempotency contracts are implemented.

Deferred:

- side-effect/action steps;
- compensation execution;
- parallel fan-out/fan-in;
- distributed cron.

## 11. Phase 8 — Quality

Current implementation (kernel):

- versioned scorecards with immutable published versions and a stored `v1`
  calculation policy;
- deterministic sampling rules (MANUAL/RANDOM/HANDOFF_TRIGGERED) with
  idempotent per-conversation sample decisions;
- versioned evaluation state machine
  (QUEUED/ASSIGNED/IN_REVIEW/SUBMITTED/COMPLETED plus RETURNED/CANCELED);
- criterion findings with conversation-scoped message evidence;
- reproducible totals recomputed from the stored scorecard version;
- AI evaluations fenced as non-completable proposals linked via `ai_proposal_id`;
- finding-linked remediations with guarded status transitions;
- memory/PostgreSQL parity tests.

Exit criteria:

- every quality score links to conversation evidence;
- sampling is reproducible;
- human and AI evaluation are distinguishable.

Deferred until review volume justifies them: calibration records, stratified
sampling, AI-proposed findings generation, and analytics rollups.

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

## 14. Operator Experience (cross-cutting, shipped incrementally)

Implemented:

- operator login/session shell in `apps/web` (token in memory only, organization
  switcher for multi-org users);
- enriched inbox endpoint `GET /api/v1/inbox` (conversation + customer +
  last message + active assignment/assignee + open handoff) with status,
  control, and assignment filters;
- per-conversation handoff scoping on `GET /api/v1/handoffs`;
- inbox list with 5s polling, conversation detail with message polling,
  handoff banner, idempotent human reply (`clientMessageId`), and claim
  via the existing assignment transaction;
- web CI (lint/typecheck/build).

Partially implemented:

- message content uses `dir="auto"` bubbles; full RTL shell and Arabic-first
  QA remain open.

Target (not started):

- outbound delivery boundary to providers;
- WhatsApp adapter;
- quality analytics/calibration UI.

Deferred:

- WebSockets/realtime transport (correct polling first);
- advanced inbox analytics.

## 15. Vertical Slice Rule

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


## Financial & Commercial Integration

Commercial gate: Billing and finance are not documentation-only. Launch readiness requires measured cost attribution, payment/reconciliation evidence, and a reproducible cash-to-launch / first-customer / break-even model before commercial scaling.

Cross-reference: [Financial Model](../finance/financial-model.md) and [Finance & Commercial Control Tickets](../Tickets/12-finance-commercial-control.md). Economic assumptions remain assumptions until replaced by measured evidence.