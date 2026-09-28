# Testing Policy — Implementation Specification

> Status: **Target production testing contract**

## 1. Test Architecture

~~~mermaid
flowchart TB
UNIT[Unit] --> APP[Application]
APP --> INT[Integration]
INT --> CONTRACT[API/Event Contract]
CONTRACT --> E2E[Critical E2E]
SEC[Security] --> GATE[Release Gate]
UNIT --> GATE
APP --> GATE
INT --> GATE
CONTRACT --> GATE
E2E --> GATE
~~~

## 2. Unit Layer

Test:

- state transitions;
- policy decisions;
- calculations;
- parsers;
- serializers;
- retry classification.

## 3. Application Layer

Use realistic persistence:

- create customer;
- ingest conversation;
- assign workforce;
- publish AI agent;
- execute workflow step;
- update subscription.

## 4. Integration Layer

Test actual infrastructure contracts:

- PostgreSQL constraints;
- transactions;
- queue delivery;
- object storage;
- search adapter;
- provider adapters.

## 5. Contract Layer

API:

- schema;
- status codes;
- error codes;
- auth;
- idempotency;
- pagination;
- concurrency.

Events:

- JSON Schema;
- producer output;
- consumer compatibility;
- duplicate handling.

## 6. Security Matrix

~~~text
cross-tenant read
cross-tenant write
cross-tenant search
cross-tenant export
role escalation
scope escalation
webhook spoofing
replay
secret leakage
unauthorized tool call
AI context leakage
~~~

## 7. Concurrency Tests

Test:

- two assignments;
- two quota consumers;
- duplicate payment webhook;
- human takeover vs AI send;
- simultaneous workflow run creation.

## 8. Idempotency

For every retry-sensitive operation:

~~~mermaid
sequenceDiagram
participant C as Client
participant API as API
participant DB as Idempotency Store
C->>API: Request key K
API->>DB: Lookup K
DB-->>API: Missing
API->>DB: Execute + save outcome
API-->>C: Outcome
C->>API: Same request K
API->>DB: Lookup K
DB-->>API: Existing outcome
API-->>C: Same outcome
~~~

Also test same key with changed input -> deterministic conflict.

## 9. AI Safety

Regression set includes:

- direct injection;
- indirect injection;
- unauthorized retrieval;
- tool abuse;
- fabricated action completion;
- budget runaway;
- required handoff suppression.

## 10. Workflow Recovery

Test:

- worker crash;
- lease loss;
- retry;
- dead letter;
- long wait;
- approval expiry;
- cancellation;
- partial success.

## 11. Provider Tests

CI uses deterministic fixtures.

Sandbox/contract tests validate real provider behavior separately.

## 12. Test Data

Use isolated synthetic tenants.

Never use production customer content in normal CI.

## 13. Coverage

Coverage measures exercised code, not correctness.

Critical invariants require targeted tests regardless of aggregate percentage.

## 14. Flaky Tests

Do not hide flaky behavior with arbitrary retries.

Classify whether the defect is:

- test;
- timing;
- dependency;
- application;
- infrastructure.

## 15. Acceptance

The test system is complete when every critical invariant has a deterministic proof path and every important external boundary has failure tests.
