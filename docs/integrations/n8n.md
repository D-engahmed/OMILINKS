# n8n Integration — Implementation Specification

> Status: **Target external-automation blueprint**

## 1. Boundary

n8n is an external automation engine.

OMILINKS remains authoritative for:

- customer;
- conversation;
- authorization;
- AI policy;
- workflow state;
- billing.

## 2. Modes

~~~text
OMILINKS -> n8n trigger
n8n -> OMILINKS API action
n8n -> OMILINKS callback
~~~

## 3. Architecture

~~~mermaid
sequenceDiagram
participant O as OMILINKS
participant N as n8n
participant X as External System
participant C as Callback
O->>N: Authenticated event
N->>X: External operation
X-->>N: Result
N->>C: Authenticated callback
C->>O: Correlated outcome
O->>O: Resume workflow
~~~

## 4. Authentication

Outbound events are signed/authenticated.

Inbound API access uses scoped service credentials.

Never provide n8n an unrestricted administrator credential.

## 5. Tenant Binding

Connection includes:

~~~text
organization_id
scope
credential identity
~~~

Every referenced resource is resolved within that organization/scope.

## 6. Idempotency

Use:

~~~text
n8n execution ID
+ semantic operation
~~~

as the basis for idempotency.

Duplicate execution cannot create duplicate financial/customer-visible effects.

## 7. Long Running Work

Do not hold an HTTP request open.

Persist:

~~~text
WAITING_EXTERNAL
correlation_id
timeout_at
~~~

Callback resumes the durable workflow.

## 8. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid credential | reject |
| n8n unavailable | queue/retry |
| duplicate action | idempotent |
| callback duplicate | idempotent |
| callback delayed | remain waiting |
| callback timeout | explicit failure/escalation |
| external workflow failure | step failure |
| cross-tenant resource | deny |

## 9. Security

- scoped service identity;
- signed outbound payloads;
- no internal database/API bypass;
- secrets server-side;
- mutation audit.

## 10. Observability

Track n8n execution ID, correlation ID, request latency, callback latency, retries, waiting duration and timeout rate.

## 11. Tests

- trigger;
- credential failure;
- duplicate;
- delayed callback;
- callback duplicate;
- n8n outage;
- timeout;
- cross-tenant action;
- workflow recovery.

## 12. Acceptance

n8n is integrated correctly when it remains an external execution dependency rather than becoming OMILINKS business-data authority.
