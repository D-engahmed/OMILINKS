# WhatsApp Integration

> Status: **Target production integration contract**

## 1. Purpose

The WhatsApp adapter translates provider-specific messaging into the canonical OMILINKS customer/conversation model.

The adapter owns provider protocol details. The core Conversation domain must never import WhatsApp SDK objects or provider-specific webhook structures.

## 2. Connection Model

A WhatsApp connection is tenant-scoped and contains:

- organization ID;
- provider account identifier;
- business/phone endpoint identity;
- credential reference;
- webhook configuration;
- connection lifecycle state;
- provider capability metadata;
- health timestamps.

One organization may have multiple channel connections.

## 3. Connection Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> CONFIGURING
    CONFIGURING --> VERIFYING
    VERIFYING --> ACTIVE
    VERIFYING --> ERROR
    ACTIVE --> DEGRADED
    DEGRADED --> ACTIVE
    ACTIVE --> DISCONNECTED
    ERROR --> VERIFYING
~~~

A connection becomes ACTIVE only after required credentials and webhook configuration have been verified.

## 4. Inbound Message Pipeline

~~~mermaid
sequenceDiagram
    participant P as WhatsApp Provider
    participant W as Webhook Adapter
    participant I as Identity Resolver
    participant C as Conversation Domain
    participant Q as Queue
    P->>W: Signed callback
    W->>W: Verify provider request
    W->>W: Build dedupe key
    W->>I: Resolve channel identity
    I-->>W: Canonical customer
    W->>C: Persist canonical message
    W->>Q: Enqueue asynchronous processing
    W-->>P: Accepted
~~~

The provider receives an acknowledgement without waiting for AI inference or workflow execution.

## 5. Identity Mapping

Use a tenant-scoped provider identity tuple:

~~~text
organization
+ provider = whatsapp
+ provider_account_id
+ external_identity_id
~~~

Do not treat a phone number as a globally unique OMILINKS customer ID.

Customer merge remains a Customer-domain operation.

## 6. Message Mapping

Normalize provider messages into canonical message types:

- text;
- media attachment;
- interactive response;
- reaction;
- status event.

Provider-specific fields are retained only in integration metadata when required for reconciliation.

## 7. Outbound Delivery

~~~mermaid
sequenceDiagram
    participant C as Conversation Domain
    participant Q as Delivery Worker
    participant A as WhatsApp Adapter
    participant P as Provider
    C->>Q: Canonical outbound message
    Q->>A: Deliver message
    A->>P: Provider API request
    P-->>A: Provider response
    A-->>Q: Delivery outcome
    Q->>C: Update delivery state
~~~

The canonical message exists before external sending begins.

## 8. Idempotency

Inbound events use provider event/message identifiers when available.

Outbound retries must use:

- canonical message identity;
- provider-supported idempotency where available;
- reconciliation when a timeout leaves outcome unknown.

Repeated processing must not create duplicate customer-visible messages.

## 9. Media

Store large media outside PostgreSQL.

Metadata includes:

- provider media ID;
- MIME type;
- size;
- checksum;
- object-storage reference;
- processing state.

Download and scanning are asynchronous jobs.

## 10. Reliability

Provider throttling is handled by the delivery worker.

A 429 response becomes scheduled retry state rather than blocking an API process.

An unknown response to a side-effecting send is reconciled before unsafe repetition.

## 11. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid webhook authentication | reject, no mutation |
| duplicate inbound event | idempotent acknowledgement |
| provider timeout | retry/reconcile |
| rate limit | scheduled retry |
| expired credential | connection DEGRADED/ERROR |
| invalid media | failed attachment state |
| unsupported message feature | explicit unsupported result |

## 12. Security

- credentials are server-side;
- webhook verification precedes mutation;
- provider account cannot select an organization;
- customer identity resolution is tenant-scoped;
- logs do not contain credentials;
- raw message retention follows data policy.

## 13. Reconciliation

Reconciliation compares recent canonical delivery state with provider-visible message/delivery state where supported.

It is mandatory for operations where the provider response was unknown.

## 14. Observability

Track:

- inbound event rate;
- verification failures;
- duplicate rate;
- processing lag;
- outbound latency;
- provider status codes;
- delivery lag;
- retry age;
- dead letters;
- media processing failures.

All metrics include organization and connection identity.

## 15. Testing

Required integration tests:

- valid callback;
- invalid signature/token;
- duplicate callback;
- new customer identity;
- existing customer identity;
- new conversation;
- media message;
- outbound send;
- rate limit;
- timeout after potential send;
- delivery status callback;
- expired credentials;
- cross-tenant provider identity.

## 16. Acceptance Criteria

- WhatsApp SDK behavior is isolated behind the adapter.
- Duplicate inbound events produce one canonical message.
- Canonical messages exist before provider delivery.
- Unknown outbound outcomes are reconciled.
- Provider outages do not affect unrelated channels.
- Credentials never reach browser/model/log contexts.
