# Functional Requirements — Engineering Specification

> Status: **Target requirements baseline**

## Requirement Convention

Every requirement has a stable identifier.

~~~text
FR-<domain>-<number>
~~~

A requirement is not complete until it maps to:

~~~text
requirement
 -> domain invariant
 -> API/event contract
 -> implementation
 -> test
 -> observability
 -> acceptance evidence
~~~

## FR-TEN-001 Organization Provisioning

The system shall create an Organization atomically with its mandatory owner membership, default configuration and initial subscription/trial state.

Constraints:

- repeated signup must be idempotent;
- partial provisioning must not create an active tenant;
- external side effects occur after transaction commit.

Verification: integration test + database assertion.

## FR-TEN-002 Tenant Isolation

Every tenant-owned resource shall be scoped by organization and effective scope.

Verification: cross-tenant negative test matrix.

## FR-ID-001 Membership-Based Access

A User shall access an Organization only through an active Membership.

Verification: authorization tests.

## FR-ID-002 Scoped Permissions

Membership permissions shall support organization/client/program/sector/team/site scope.

Verification: scope escalation tests.

## FR-CUS-001 Canonical Customer

Each provider identity maps to at most one canonical customer within its organization/provider-account namespace.

Verification: unique constraint + concurrency test.

## FR-CUS-002 Controlled Merge

Customer merge shall preserve historical identities and audit history and shall never cross organization boundaries.

Verification: merge transaction tests.

## FR-CONV-001 Canonical Conversation

Provider messages shall map to an internal Conversation and Message model independent of provider SDK types.

Verification: adapter contract tests.

## FR-CONV-002 Message Dedupe

Repeated provider events shall not create duplicate canonical messages.

Verification: duplicate webhook test.

## FR-CONV-003 Control Version

Every autonomous customer-visible action shall verify conversation control version immediately before the side effect.

Verification: human-takeover race test.

## FR-WF-001 Workforce Assignment

The platform shall create durable assignments for conversations and preserve assignment history.

Verification: application + concurrency test.

## FR-WF-002 Workforce Presence

Presence shall expire/stale independently from worker lifecycle.

Verification: TTL test.

## FR-ROUTE-001 Deterministic Routing

Routing shall produce deterministic results for identical policy/context/candidate snapshots.

Verification: routing property tests.

## FR-ROUTE-002 Queue Fallback

If no candidate qualifies, work shall enter a durable queue or explicit escalation state.

Verification: no-match integration test.

## FR-AI-001 Versioned AI Policy

AI agents shall reference immutable policy versions for every run.

Verification: publication/version test.

## FR-AI-002 Independent AI Authorization

AI tool access shall be independently authorized and shall not inherit creator permissions.

Verification: privilege-inheritance negative test.

## FR-AI-003 Run Recovery

AI runs shall recover only from persisted safe states.

Verification: worker-crash/recovery tests.

## FR-KNO-001 Versioned Knowledge

Knowledge documents shall be immutable once indexed and traceable by source/version.

Verification: version immutability + retrieval fixture.

## FR-KNO-002 Retrieval Isolation

Knowledge retrieval shall filter authorized tenant/scope before model exposure.

Verification: cross-tenant retrieval test.

## FR-TOOL-001 Versioned Tools

Every executable tool shall have a versioned input/output contract.

Verification: registry validation test.

## FR-TOOL-002 Side-Effect Safety

Every side-effecting tool shall define idempotency/reconciliation semantics.

Verification: timeout/duplicate tests.

## FR-WORK-001 Durable Workflow Runs

Workflow executions shall persist state and survive worker restarts.

Verification: crash recovery test.

## FR-WORK-002 Approval Binding

Human approval shall bind to the exact action/version/arguments being approved.

Verification: approval mutation test.

## FR-QUAL-001 Versioned Scorecards

Completed evaluations shall reference immutable scorecard versions.

Verification: scorecard mutation test.

## FR-QUAL-002 Evidence

Quality findings shall reference durable operational evidence.

Verification: evidence linkage test.

## FR-BILL-001 Authoritative Entitlements

Backend entitlement state shall gate governed operations.

Verification: quota/security tests.

## FR-BILL-002 Payment Reconciliation

Subscription activation shall depend on verified provider/payment state rather than browser redirect state.

Verification: payment webhook/reconciliation tests.

## FR-BILL-003 Idempotent Usage

Repeated usage events shall not double count the same billable fact.

Verification: usage dedupe test.

## FR-INT-001 Provider Isolation

Provider-specific SDK types and payloads shall remain inside integration adapters.

Verification: dependency/layering checks.

## FR-INT-002 Channel Failure Isolation

A failed provider shall not make unrelated channels unavailable.

Verification: fault-injection test.

## FR-API-001 Stable Public API

Public endpoints shall be versioned and expose stable machine-readable errors.

Verification: OpenAPI contract tests.

## FR-API-002 Mutation Idempotency

Retry-sensitive mutations shall support idempotency keys.

Verification: duplicate-request test.

## FR-EVT-001 Transactional Outbox

Business state and required outbox events shall commit atomically.

Verification: transaction failure injection.

## FR-EVT-002 At-Least-Once Consumption

Consumers shall tolerate duplicate event delivery.

Verification: duplicate event tests.

## FR-SEC-001 Privileged Audit

Security-sensitive operations shall generate audit evidence.

Verification: audit integration tests.

## FR-DATA-001 Retention

Data lifecycle shall be controlled by class-specific retention policy.

Verification: retention/purge tests.

## FR-OPS-001 Observability

Critical workflows shall propagate correlation identifiers across API, events, workers and provider operations.

Verification: trace integration test.

## FR-OPS-002 Recovery

Production systems shall have tested restore/reconciliation procedures.

Verification: restore drill evidence.

## Definition of Functional Completeness

A requirement is not considered implemented because a route, UI component or database table exists. The behavior must satisfy the complete requirement chain and its negative/failure cases.


## Financial & Commercial Integration

Financial requirements add: usage events must be attributable and idempotent; billing state must be server-authoritative; financial records require reconciliation and immutable pricing context; production financial claims require evidence from source records.

Cross-reference: [Financial Model](../finance/financial-model.md) and [Finance & Commercial Control Tickets](../Tickets/12-finance-commercial-control.md). Economic assumptions remain assumptions until replaced by measured evidence.