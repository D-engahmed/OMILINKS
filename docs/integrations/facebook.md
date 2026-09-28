# Facebook Messenger Integration — Implementation Specification

> Status: **Target provider-adapter blueprint**

## 1. Boundary

Page-scoped provider behavior remains inside FacebookAdapter.

## 2. Connection State

~~~mermaid
stateDiagram-v2
    [*] --> CONFIGURING
    CONFIGURING --> VERIFYING
    VERIFYING --> ACTIVE
    VERIFYING --> FAILED
    ACTIVE --> DEGRADED
    DEGRADED --> ACTIVE
    ACTIVE --> DISCONNECTED
~~~

Connection activation requires verified credentials/webhook configuration.

## 3. Inbound

~~~text
provider callback
 -> verify
 -> dedupe
 -> normalize
 -> resolve customer
 -> persist conversation/message
 -> queue async work
~~~

## 4. Provider Thread Mapping

Store provider Page/thread identifiers separately from canonical conversation identifiers.

The Conversation aggregate owns state.

## 5. Outbound

~~~mermaid
sequenceDiagram
participant C as Conversation
participant Q as Delivery Worker
participant A as Facebook Adapter
participant P as Provider
C->>Q: Delivery job
Q->>A: Send canonical message
A->>P: API request
P-->>A: Result
A-->>Q: Delivery outcome
Q->>C: Persist status
~~~

## 6. Delivery Reconciliation

Use provider message IDs to reconcile:

- local pending/provider delivered;
- local sent/provider failed;
- unknown response;
- missing status callback.

Reconciliation updates delivery state, not message history.

## 7. Dedupe

Provider event/update/message IDs must be stored with tenant/account context.

## 8. Failure

| Failure | Behavior |
|---|---|
| forged webhook | reject |
| duplicate webhook | idempotent |
| provider timeout | reconcile |
| 429 | retry |
| page credential error | degrade |
| unsupported feature | capability error |

## 9. Security

Page ID cannot select tenant.

Credentials remain server-side.

## 10. Testing

- valid callback;
- invalid callback;
- duplicate callback;
- customer mapping;
- conversation creation;
- send;
- timeout;
- rate limit;
- credential revocation;
- cross-tenant Page ID.

## 11. Acceptance

Facebook integration is complete when Page/account binding, event dedupe, delivery reconciliation and outage isolation are verified.
