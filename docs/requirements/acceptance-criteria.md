# Acceptance Criteria

> Status: **Target production release gate**

## 1. Definition of Done

A feature is complete only when:

1. required behavior is documented;
2. domain invariants are explicit;
3. authorization is implemented;
4. tenant isolation is tested;
5. failure behavior is defined;
6. retries/idempotency are defined;
7. observability exists;
8. API/event contracts are updated;
9. migrations are safe;
10. tests pass;
11. UX states are complete;
12. release/rollback impact is understood.

## 2. Security Gates

~~~text
cross-tenant read -> DENY
cross-tenant write -> DENY
invalid webhook -> NO MUTATION
unauthorized tool -> NO EXECUTION
AI prompt injection -> POLICY CHECK
secret in logs -> BLOCK RELEASE
~~~

## 3. Core Scenario Gates

| Scenario | Must prove |
|---|---|
| tenant creation | atomic/idempotent provisioning |
| multi-org user | isolation between memberships |
| inbound channel event | verified + deduplicated |
| conversation routing | deterministic decision evidence |
| human takeover | stale AI action rejected |
| AI tool | authorization + idempotency |
| knowledge retrieval | scope filtering before model exposure |
| workflow restart | durable resume |
| payment webhook | verified + idempotent reconciliation |
| quota limit | backend enforcement |
| export | permission + audit + expiry |

## 4. Acceptance Test Structure

Every scenario records:

- preconditions;
- action;
- expected state;
- expected event;
- expected audit;
- expected telemetry;
- failure alternative.

## 5. API Acceptance

API tests must validate:

- authentication;
- authorization;
- request validation;
- status codes;
- error envelope;
- pagination;
- idempotency;
- concurrency;
- tenant isolation.

## 6. Event Acceptance

Event tests must validate:

- schema;
- version;
- tenant context;
- correlation;
- producer publication;
- duplicate consumer handling;
- dead-letter behavior.

## 7. AI Acceptance

AI changes must validate:

- context access;
- guardrails;
- tool access;
- model routing;
- budget;
- handoff;
- regression dataset;
- production monitoring.

## 8. Workflow Acceptance

Validate:

- publish/version;
- trigger dedupe;
- step state;
- retry;
- approval;
- cancellation;
- restart;
- partial success;
- compensation where supported.

## 9. Billing Acceptance

Validate:

- plan/entitlement;
- payment verification;
- duplicate webhook;
- reconciliation;
- quota enforcement;
- suspension;
- historical pricing/usage.

## 10. Release Gate

~~~mermaid
flowchart TD
REQ[Requirement] --> IMPL[Implementation]
IMPL --> UNIT[Unit]
UNIT --> INT[Integration]
INT --> CONTRACT[API/Event]
CONTRACT --> SECURITY[Security]
SECURITY --> E2E[E2E]
E2E --> OBS[Observability]
OBS --> RELEASE[Release Gate]
RELEASE -->|pass| PROD[Production]
RELEASE -->|fail| FIX[Corrective Work]
~~~

## 11. Evidence Standard

Do not mark an acceptance criterion complete from a screenshot or manual claim alone.

Prefer:

- automated test;
- contract fixture;
- structured trace;
- database assertion;
- monitored deployment evidence.

## 12. Acceptance Principle

If the team cannot explain what happens when the happy path fails, the feature is not production-ready.
