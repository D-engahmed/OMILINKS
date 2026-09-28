# Webhook API Contract

> Status: **Target production API contract**

Webhook endpoints are inbound integration boundaries. Their responsibilities are verification, durable acceptance, normalization, and asynchronous processing.

## 1. Processing Contract

~~~mermaid
flowchart LR
HTTP[Provider Request] --> VERIFY[Verify Signature / Token]
VERIFY -->|Invalid| REJECT[Reject]
VERIFY -->|Valid| NORMALIZE[Normalize]
NORMALIZE --> DEDUPE[Build Idempotency Key]
DEDUPE --> STORE[Persist Event]
STORE --> ACK[202 Accepted]
STORE --> QUEUE[Async Queue]
QUEUE --> DOMAIN[Domain Processing]
DOMAIN --> OUTBOX[Domain Events]
~~~

The request must not wait for AI generation, long workflow execution, or analytics fan-out.

## 2. Verification

Provider adapters implement provider-specific verification such as:

- HMAC signature;
- signed timestamp;
- verification token;
- challenge response;
- provider-specific authentication headers.

Verification occurs before business mutation.

## 3. Request Limits

Webhook endpoints require:

- body-size limits;
- content-type validation;
- request timeout;
- rate limiting;
- bounded parsing.

Malformed input must not reach expensive downstream operations.

## 4. Idempotency

Preferred key:

~~~text
provider
+ provider_account
+ provider_event_id
~~~

If the provider has no stable event ID, use a deterministic composition of documented provider fields.

Do not use arrival timestamp as identity.

## 5. Durable Acceptance

A webhook should be acknowledged only after its security result and event state are durably persisted, unless the provider contract explicitly requires another behavior.

After durable acceptance, downstream processing is asynchronous.

## 6. Duplicate Delivery

~~~mermaid
sequenceDiagram
participant P as Provider
participant W as Webhook API
participant DB as Event Store
participant Q as Queue
P->>W: Event E
W->>DB: Insert dedupe key
alt First delivery
  DB-->>W: Inserted
  W->>Q: Enqueue
  W-->>P: 202
else Duplicate
  DB-->>W: Already exists
  W-->>P: 202
end
~~~

Duplicate deliveries must never duplicate:

- customer creation;
- conversation messages;
- payments;
- workflow triggers;
- other non-idempotent side effects.

## 7. Raw Event Record

Subject to retention policy, store:

- provider;
- provider account;
- event ID;
- verification result;
- received timestamp;
- correlation ID;
- normalized event type;
- processing state;
- attempt count;
- payload reference.

Raw customer content should be minimized.

## 8. Normalization

External provider payloads become canonical internal events.

Example:

~~~text
WhatsApp provider payload
 -> integration.webhook.received
 -> conversation.message.received
 -> routing request
~~~

Provider-specific structures must remain inside integration adapters.

## 9. Replay

Internal replay is privileged.

Replay must:

1. identify original event;
2. preserve original security metadata;
3. create a new processing attempt;
4. preserve original history;
5. run through normal dedupe and authorization checks.

Replay must never change tenant ownership.

## 10. Failure Isolation

Provider failure must be channel-local.

If WhatsApp is unavailable:

- stored conversations remain readable;
- other channels continue;
- queued events remain durable;
- provider state becomes degraded;
- retry/dead-letter state becomes visible.

## 11. Operations

Operators need:

- verification failure count;
- last successful webhook;
- processing lag;
- duplicate count;
- retry state;
- dead-letter count;
- replay control;
- provider health.

## 12. Acceptance Criteria

- Invalid webhook authentication creates no business mutation.
- Duplicate events create one business effect.
- Webhook acknowledgement does not depend on AI/workflow completion.
- Provider parsing is isolated.
- Stored events can be replayed.
- Replay cannot cross tenant boundaries.
