# SMS Integration

> Status: **Target production integration contract**

## 1. Purpose

SMS is a first-class conversation channel even though it differs from social channels in threading, segmentation and delivery-receipt behavior.

The integration adapter owns gateway protocol behavior. The Conversation domain owns canonical message and conversation semantics.

## 2. Connection Model

A gateway connection contains:

- organization;
- gateway account;
- sender number/pool;
- credential reference;
- callback configuration;
- status;
- capability metadata;
- health information.

## 3. Phone Identity

Phone identity is tenant-scoped:

~~~text
organization
+ gateway account
+ normalized phone number
~~~

A phone number alone is not a global OMILINKS customer key.

Identity matching remains a Customer-domain operation.

## 4. Inbound Pipeline

~~~mermaid
sequenceDiagram
    participant G as SMS Gateway
    participant A as SMS Adapter
    participant I as Identity Resolver
    participant C as Conversation
    G->>A: Inbound callback
    A->>A: Verify provider request
    A->>I: Resolve phone identity
    I-->>A: Customer
    A->>C: Persist canonical message
    C-->>A: Accepted
~~~

## 5. Threading

SMS may have no provider thread identifier.

The Conversation domain therefore needs an explicit product rule for opening/reusing conversations.

A possible rule is:

~~~text
customer identity
+ active SMS channel scope
+ conversation timeout/reopen policy
-> canonical conversation
~~~

The adapter must not invent conversation lifecycle semantics.

## 6. Message Segmentation

Long SMS messages may be split into provider segments.

Where provider metadata identifies the segments as one message, the adapter reconstructs one canonical message.

Otherwise each event remains a distinct provider message and the ambiguity is surfaced rather than guessed.

## 7. Delivery Receipts

~~~mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> SENT
    SENT --> DELIVERED
    SENT --> FAILED
    FAILED --> RETRYING
    RETRYING --> SENT
~~~

Provider receipts update delivery state without rewriting the original message.

## 8. Outbound Flow

~~~mermaid
flowchart LR
MESSAGE[Canonical Message] --> WORKER[Delivery Worker]
WORKER --> ADAPTER[SMS Adapter]
ADAPTER --> GATEWAY[SMS Gateway]
GATEWAY --> RECEIPT[Delivery Receipt]
RECEIPT --> STATE[Canonical Delivery State]
~~~

The canonical message exists before gateway delivery.

## 9. Idempotency

Inbound callbacks use provider message/event IDs when available.

Delivery receipts are idempotent.

Outbound retries use canonical message identity or provider-safe idempotency. Unknown send outcomes require reconciliation when duplicates could become customer-visible.

## 10. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid callback | reject |
| duplicate callback | idempotent |
| duplicate receipt | no-op state update |
| invalid destination | delivery failed |
| gateway timeout | reconcile |
| gateway rate limit | scheduled retry |
| segmentation issue | failed send state |
| credential failure | connection degraded |

## 11. Privacy

Phone numbers are sensitive.

Telemetry should mask numbers when the full value is not operationally needed.

Credentials and message bodies are not placed in generic logs.

## 12. Cross-Domain Contract

- Customer domain owns customer identity.
- Conversation domain owns message/conversation state.
- Workforce/routing owns assignment.
- AI may operate on the conversation according to policy.
- Billing can meter message usage.
- Quality can sample conversations after retention rules permit.

## 13. Observability

Track:

- inbound message rate;
- segment count;
- delivery success/failure;
- carrier/gateway error class;
- receipt lag;
- retry age;
- callback verification failures;
- connection health.

## 14. Testing

Required:

- single inbound message;
- multi-segment message;
- duplicate callback;
- receipt callback;
- invalid number;
- timeout;
- retry;
- credential failure;
- cross-tenant identity attempt.

## 15. Acceptance Criteria

- Segmented messages are reconstructed correctly when provider metadata permits.
- Phone identity is tenant-scoped.
- Delivery receipts are idempotent.
- Unknown outbound outcomes are not blindly retried.
- Sensitive phone data is minimized in telemetry.
