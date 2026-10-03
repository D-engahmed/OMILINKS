# Webhook API — Implementation Specification

> Status: **Implemented for the Web Widget; provider-specific webhooks remain pending**

## 1. Webhook Contract

The current Phase 3 public widget ingress is:

~~~text
GET  /public/v1/widget/{publicKey}/config
POST /public/v1/widget/{publicKey}/messages
OPTIONS /public/v1/widget/{publicKey}/messages
~~~

The widget endpoint resolves tenant ownership from the integration public key and never accepts an organization id from the browser.

For provider webhooks such as WhatsApp and Telegram, the generic verification/normalization contract below remains the target adapter contract.


Webhook processing is:

~~~text
receive
 -> authenticate
 -> normalize
 -> deduplicate
 -> persist
 -> acknowledge
 -> process asynchronously
~~~

## 2. Verification

Provider-specific adapter performs:

- signature verification;
- timestamp/replay check where applicable;
- challenge verification;
- provider-account binding.

Only verified events enter canonical event processing.

## 3. Dedupe

Preferred key:

~~~text
provider
+ provider_account
+ provider_event_id
~~~

Fallback key is a deterministic provider-specific composition.

A duplicate must be detected before business mutation.

## 4. HTTP Response Semantics

| Condition | Response |
|---|---|
| invalid auth | 401/403 |
| malformed authenticated payload | 400 |
| accepted + durably stored | 202 |
| duplicate known event | 202/deterministic accepted |
| internal persistence failure | retry-compatible failure |

Provider-specific retry semantics override generic assumptions.

## 5. Processing Pipeline

~~~mermaid
flowchart TD
HTTP[Provider HTTP] --> LIMIT[Request Limits]
LIMIT --> VERIFY[Authentication]
VERIFY --> NORMALIZE[Canonical Event]
NORMALIZE --> DEDUPE[Dedupe Constraint]
DEDUPE --> STORE[Durable Store]
STORE --> ACK[Response]
STORE --> QUEUE[Processing Queue]
QUEUE --> DOMAIN[Application/Domain]
DOMAIN --> OUTBOX[Follow-on Events]
~~~

## 6. Raw Payload Policy

Raw payload retention should be minimized and bounded.

Store when operationally necessary:

- provider;
- account;
- event ID;
- verification metadata;
- normalized event type;
- payload reference;
- processing state.

## 7. Replay Protection

Replay controls include:

- provider timestamp validity;
- event dedupe;
- internal replay authorization;
- audit of replay attempts.

Replay must not change tenant ownership.

## 8. Consumer Failure

After durable storage, downstream failure should not force the provider to resend.

Queue retry/dead-letter handles processing.

## 9. Duplicate Business Effects

Explicitly protect against duplicate:

- customer creation;
- message creation;
- payment;
- workflow trigger;
- outbound action.

## 10. Security

- body-size limits;
- signature before mutation;
- rate limiting;
- provider/account binding;
- secret redaction;
- tenant-safe replay.

## 11. Observability

Track:

- verification failures;
- event ingress;
- dedupe;
- queue lag;
- processing latency;
- retries;
- dead letters;
- provider health.

## 12. Tests

- forged signature;
- expired timestamp;
- duplicate;
- malformed payload;
- provider retry;
- downstream outage;
- tenant mismatch;
- replay authorization;
- large payload.

## 13. Acceptance

A webhook is complete only when authentication, dedupe, durability, replay, downstream retry and observability are explicit.
