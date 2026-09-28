# Testing Policy

> Status: **Target production testing contract**

Testing is organized around risk, invariants and system boundaries.

## 1. Test Pyramid

~~~mermaid
flowchart TB
UNIT[Unit] --> APP[Application]
APP --> INT[Integration]
INT --> CONTRACT[Contract]
CONTRACT --> E2E[End-to-End]
SEC[Security] --> GATE[Release Gate]
UNIT --> GATE
APP --> GATE
INT --> GATE
CONTRACT --> GATE
E2E --> GATE
~~~

## 2. Unit Tests

Test:

- domain state transitions;
- routing rules;
- entitlement logic;
- policy evaluation;
- parsers;
- sanitizers;
- deterministic calculations.

## 3. Application Tests

Exercise full use cases:

- customer creation;
- inbound message;
- assignment;
- AI agent publication;
- workflow start;
- subscription transition;
- usage recording.

Assert both happy and invalid paths.

## 4. Integration Tests

Use real infrastructure where it gives meaningful confidence:

- PostgreSQL transactions;
- constraints;
- queues/event consumers;
- object-storage adapter;
- provider adapters.

## 5. API Contract Tests

Validate:

- OpenAPI request/response shape;
- status codes;
- error envelope;
- auth behavior;
- tenant isolation;
- idempotency;
- pagination;
- optimistic concurrency.

## 6. Event Contract Tests

Validate schema:

- required fields;
- versioning;
- producer output;
- consumer compatibility;
- representative fixtures.

## 7. Security Test Matrix

~~~text
cross-tenant read
cross-tenant write
cross-tenant search
cross-tenant export
role escalation
scope escalation
invalid webhook
replay
secret leakage
unauthorized tool call
AI context leakage
~~~

## 8. Idempotency Tests

Test first request plus duplicate request.

~~~mermaid
sequenceDiagram
participant C as Client
participant API
participant DB as Database
C->>API: Request key K
API->>DB: Check key
DB-->>API: Not found
API->>DB: Execute + store result
API-->>C: Result
C->>API: Same request K
API->>DB: Check key
DB-->>API: Existing result
API-->>C: Same result
~~~

Also test same key with different meaningful input -> conflict.

## 9. Concurrency Tests

Test races for:

- two assignment workers;
- customer updates;
- duplicate payment callbacks;
- simultaneous quota consumption;
- human takeover versus AI send.

## 10. AI Tests

Include:

- direct prompt injection;
- indirect document injection;
- unauthorized retrieval;
- unauthorized tool request;
- fabricated action claims;
- guardrail regression;
- model fallback;
- budget termination.

## 11. Workflow Tests

Test:

- worker restart;
- long wait;
- retry;
- dead letter;
- approval;
- cancellation;
- partial success;
- duplicate trigger.

## 12. Provider Tests

CI uses fixtures/mocks at the adapter boundary.

Dedicated provider sandbox tests validate real external compatibility.

## 13. End-to-End

Critical path:

~~~mermaid
flowchart LR
IN[Inbound Message] --> CONV[Conversation]
CONV --> ROUTE[Routing]
ROUTE --> AIH[Human / AI]
AIH --> TOOL[Optional Tool]
TOOL --> OUT[Outbound Message]
OUT --> DELIVERY[Delivery]
DELIVERY --> QA[Quality]
~~~

## 14. Test Data

Use deterministic fixtures and isolated test tenants.

Production customer data is never ordinary CI test data.

## 15. Coverage

Coverage is a diagnostic signal. It does not prove that critical invariants are protected.

## 16. Flaky Tests

Flakiness is treated as a defect in the test or the system unless nondeterminism is explicitly part of the contract.

Do not hide flaky behavior by multiplying retries.

## 17. Acceptance Criteria

- Critical security paths have negative tests.
- Retry-sensitive paths test duplicates.
- Concurrent paths test races.
- API/event contracts are tested.
- AI safety is regression-tested.
- Workflow recovery is tested.
- CI is independent of production data.
