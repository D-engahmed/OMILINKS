# Facebook Messenger Integration

> Status: **Target production integration contract**

## 1. Purpose

The Facebook integration connects Page-scoped messaging to the canonical OMILINKS conversation system.

The integration owns provider identity, webhook validation, outbound transport and provider delivery semantics.

## 2. Page Connection

Each connection is tenant-scoped and contains:

- organization;
- page/provider account;
- credential reference;
- webhook configuration;
- integration status;
- capability metadata;
- health timestamps.

A single organization can operate multiple page integrations.

## 3. Webhook Pipeline

~~~mermaid
sequenceDiagram
    participant P as Facebook
    participant W as Webhook Boundary
    participant V as Verifier
    participant D as Conversation Domain
    participant Q as Queue
    P->>W: Callback
    W->>V: Verify
    V-->>W: Valid
    W->>D: Persist canonical event
    W->>Q: Enqueue async processing
    W-->>P: Accepted
~~~

No AI generation occurs in the webhook transaction.

## 4. Customer Identity

Use a provider/account-scoped identity record.

Do not merge customers from display name, page nickname, or other weak signals.

Customer identity remains owned by the Customer domain.

## 5. Conversation Mapping

Provider thread identifiers are stored as external references.

Canonical conversation state controls:

- open/resolved;
- assignment;
- human/AI control;
- SLA;
- tags;
- quality history.

## 6. Outbound Delivery

~~~mermaid
flowchart LR
MESSAGE[Canonical Message] --> WORKER[Delivery Worker]
WORKER --> ADAPTER[Facebook Adapter]
ADAPTER --> PROVIDER[Provider API]
PROVIDER --> CALLBACK[Delivery Callback]
CALLBACK --> STATE[Canonical Delivery State]
~~~

The provider message ID is retained for reconciliation.

## 7. Idempotency

Inbound callbacks must use provider event/update/message identity.

Outbound sends use canonical message IDs plus provider-safe mechanisms where supported.

Unknown provider outcomes must be reconciled before retrying a side effect that could duplicate customer-visible communication.

## 8. Failure Handling

| Failure | Behavior |
|---|---|
| invalid webhook verification | reject |
| duplicate event | idempotent |
| page credential failure | connection degraded |
| timeout | reconcile/retry |
| rate limit | queue retry |
| unsupported operation | capability error |
| persistent provider outage | queued/degraded, unrelated channels unaffected |

## 9. Security

Page credentials stay server-side.

A provider Page ID never determines which organization is allowed to access an object.

All customer and conversation queries remain organization-scoped.

## 10. Reconciliation

Use stored provider IDs and recent delivery states to identify:

- local pending but provider delivered;
- local sent but provider failed;
- unknown provider outcome;
- missing callback.

Reconciliation changes delivery state, not original message history.

## 11. Observability

Track:

- connection health;
- callback verification failures;
- inbound rate;
- duplicate rate;
- outbound latency;
- status callback lag;
- provider error classes;
- retry/dead-letter state.

## 12. Testing

- valid/invalid verification;
- duplicate callback;
- customer identity mapping;
- conversation creation;
- outbound send;
- provider timeout;
- 429/rate limiting;
- delivery update;
- credential failure;
- cross-tenant Page ID misuse.

## 13. Acceptance Criteria

- Facebook provider models remain behind the adapter.
- Duplicate events are harmless.
- Delivery state is separate from message creation.
- Credential failures are visible.
- Provider outages do not corrupt unrelated channels.
