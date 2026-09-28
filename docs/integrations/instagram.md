# Instagram Integration

> Status: **Target production integration contract**

## 1. Purpose

The Instagram adapter maps business-account messaging into the canonical OMILINKS Customer, Conversation, Message and Delivery models.

The adapter owns provider-specific webhook parsing, account/page credentials, provider identifiers, capability differences and outbound transport behavior.

## 2. Connection Model

Store:

- organization;
- provider account/page identity;
- credential reference;
- webhook configuration;
- connection state;
- supported capabilities;
- last successful inbound event;
- last successful outbound operation.

Connection state:

~~~mermaid
stateDiagram-v2
    [*] --> SETUP
    SETUP --> VERIFYING
    VERIFYING --> CONNECTED
    VERIFYING --> FAILED
    CONNECTED --> DEGRADED
    DEGRADED --> CONNECTED
    CONNECTED --> DISCONNECTED
    FAILED --> VERIFYING
~~~

## 3. Inbound Flow

~~~mermaid
flowchart LR
    WEBHOOK[Instagram Webhook] --> VERIFY[Verify]
    VERIFY --> NORMALIZE[Normalize Event]
    NORMALIZE --> IDENTITY[Resolve Customer Identity]
    IDENTITY --> CONVERSATION[Persist Canonical Message]
    CONVERSATION --> QUEUE[Async Processing]
    QUEUE --> ROUTING[Routing]
~~~

Verification occurs before business mutation.

## 4. Thread Mapping

Provider thread IDs are integration references.

They must not become the canonical conversation primary key because OMILINKS controls conversation lifecycle independently of provider lifecycle.

The adapter stores:

- provider thread ID;
- provider account;
- first-seen time;
- last-seen time;
- canonical conversation ID.

## 5. Identity Mapping

Identity is scoped by:

~~~text
organization
+ provider account
+ external user identity
~~~

Display names are not sufficient for identity matching.

Ambiguous identities must enter a review or deterministic fallback path rather than triggering irreversible merge behavior.

## 6. Outbound Delivery

~~~mermaid
sequenceDiagram
    participant C as Conversation
    participant Q as Worker
    participant A as Instagram Adapter
    participant P as Provider
    C->>Q: Canonical outbound message
    Q->>A: Delivery request
    A->>P: Provider API call
    P-->>A: Response
    A-->>Q: Normalized delivery outcome
    Q->>C: Persist delivery state
~~~

The canonical message is created before provider delivery.

## 7. Capability Discovery

Provider capability differences should be represented as adapter metadata.

Example categories:

- text send;
- media send;
- reaction;
- attachment receipt;
- delivery status.

The application checks capability before requesting a feature. Unsupported functionality must return a deterministic error/state.

## 8. Idempotency

Inbound provider events use stable event/update/message identifiers.

Outbound retries use canonical message identity or provider-safe idempotency.

If the provider can return an unknown result after a timeout, reconciliation is required before duplicate-sensitive retry.

## 9. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid webhook verification | reject |
| duplicate event | acknowledge without duplicate mutation |
| provider send rejected | delivery failed |
| provider timeout | reconcile/retry based on side-effect safety |
| provider rate limit | scheduled retry |
| credential revoked | DEGRADED / reconnect |
| unsupported feature | explicit capability failure |

## 10. Security

- provider credentials are server-side;
- provider account IDs do not select tenant;
- webhook verification precedes mutation;
- all customer/conversation reads are tenant-scoped;
- raw provider payload logging is minimized.

## 11. Observability

Monitor:

- webhook volume;
- verification failures;
- dedupe rate;
- outbound latency;
- provider response classes;
- retry age;
- delivery success;
- integration health.

## 12. Testing

Test:

- verification success/failure;
- duplicate events;
- identity matching;
- new customer;
- existing customer;
- new conversation;
- unsupported capability;
- outbound success;
- timeout;
- provider rate limit;
- credential revocation;
- tenant-isolation failure.

## 13. Acceptance Criteria

- Provider structures do not leak into core domains.
- Duplicate events cannot create duplicate messages.
- Unsupported capabilities fail explicitly.
- Provider failure remains channel-local.
- Credential material remains outside client/model/log contexts.
