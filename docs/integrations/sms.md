# SMS Integration — Implementation Specification

> Status: **Target provider-adapter blueprint**

## 1. Boundary

SMSAdapter isolates gateway-specific send/receive, segmentation, delivery receipts and credential handling.

## 2. Connection

~~~text
organization_id
gateway_account
sender_pool
credential_ref
callback_config
status
health
~~~

## 3. Customer Identity

Use:

~~~text
organization
+ gateway account
+ normalized phone number
~~~

Phone number alone is not a global OMILINKS identifier.

## 4. Inbound

~~~mermaid
sequenceDiagram
participant G as Gateway
participant A as SMS Adapter
participant I as Identity
participant C as Conversation
G->>A: Inbound callback
A->>A: Verify
A->>I: Resolve identity
I-->>A: Customer
A->>C: Persist canonical message
C-->>A: Accepted
~~~

## 5. Segmentation

SMS adapters must distinguish provider transport segments from one canonical customer message.

If provider metadata proves segments belong together, reconstruct one message.

Otherwise preserve separate messages rather than guessing.

## 6. Delivery Receipts

~~~mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> SENT
    SENT --> DELIVERED
    SENT --> FAILED
    FAILED --> RETRYING
    RETRYING --> SENT
~~~

Receipt updates are idempotent.

## 7. Outbound

Canonical message is persisted before gateway send.

Unknown gateway outcome enters reconciliation.

## 8. Privacy

Phone numbers are sensitive.

Mask full numbers in general telemetry.

Provider credentials never appear in logs.

## 9. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid callback | reject |
| duplicate callback | idempotent |
| duplicate receipt | no-op |
| invalid destination | failed delivery |
| timeout | reconcile |
| 429 | retry |
| credential failure | degraded |

## 10. Tests

- single SMS;
- multipart message;
- duplicate;
- receipt;
- invalid number;
- timeout;
- rate limit;
- credential failure;
- tenant isolation.

## 11. Observability

Track inbound rate, segment count, delivery rate, gateway errors, receipt lag, retries and connection health.

## 12. Acceptance

SMS is complete when segmentation, phone identity, delivery receipts and unknown send outcomes are deterministic and testable.
