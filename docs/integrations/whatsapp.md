# WhatsApp Integration — Implementation Specification

> Status: **Target provider-adapter blueprint**

## 1. Adapter Boundary

~~~text
WhatsApp webhook/API
 -> WhatsAppAdapter
 -> Canonical IntegrationEvent
 -> Customer/Conversation Application Service
~~~

The Conversation domain never receives provider SDK objects.

## 2. Connection Model

~~~text
ChannelIntegration
  organization_id
  provider
  provider_account_id
  credential_ref
  status
  capabilities
  webhook_state
  health_state
~~~

A connection is tenant-scoped.

## 3. Inbound Webhook

~~~mermaid
flowchart TD
HTTP[Provider Callback] --> VERIFY[Signature / Auth]
VERIFY --> LIMIT[Schema + Size Validation]
LIMIT --> DEDUPE[Provider Event Dedupe]
DEDUPE --> NORMALIZE[Normalize Message]
NORMALIZE --> IDENTITY[Resolve Customer Identity]
IDENTITY --> CONV[Conversation Command]
CONV --> EVENT[Canonical Event]
EVENT --> QUEUE[Async Work]
~~~

Webhook acknowledgement occurs after durable acceptance, not after AI processing.

## 4. Identity Key

Use provider-account scope:

~~~text
organization_id
provider = whatsapp
provider_account_id
external_identity_id
~~~

Phone number alone is insufficient as a global identity key.

## 5. Message Normalization

Map:

~~~text
text
media
interactive
reaction
delivery status
template/system events
~~~

to canonical message/event types.

Unsupported types become explicit integration events and are observable.

## 6. Outbound Delivery

~~~mermaid
sequenceDiagram
participant APP as Application
participant OUT as Outbox
participant W as Worker
participant A as WhatsApp Adapter
participant P as Provider
APP->>OUT: message.delivery.requested
OUT->>W: Delivery job
W->>A: Canonical send request
A->>P: Provider API
P-->>A: Response
A-->>W: Normalized result
W->>APP: Delivery state event
~~~

## 7. Idempotency

Inbound dedupe uses provider event/message identity.

Outbound idempotency uses canonical message identity plus provider-safe semantics where available.

## 8. Unknown Outcome

A timeout after send enters UNKNOWN/RECONCILIATION.

Never treat timeout as definitive failure.

## 9. Media

Store media in object storage with:

~~~text
provider_media_id
content_type
size
checksum
object_key
scan_state
~~~

Provider media fetch happens asynchronously.

## 10. Rate Limiting

429/throttling becomes scheduled retry with bounded backoff. The HTTP API is never held while waiting.

## 11. Credential Failure

Credential invalidation changes connection health and creates operator-visible remediation.

Existing canonical conversations remain readable.

## 12. Failure Matrix

| Failure | State |
|---|---|
| invalid webhook | rejected |
| duplicate event | deduplicated |
| provider timeout | unknown/reconcile |
| 429 | retry scheduled |
| invalid media | attachment failed |
| credential failure | integration degraded |
| unsupported type | explicit unsupported event |

## 13. Testing

- forged callback;
- duplicate callback;
- identity collision;
- new conversation;
- outbound duplicate;
- timeout after send;
- 429;
- delivery callback;
- credential failure;
- media processing;
- cross-tenant provider account.

## 14. Observability

- ingress rate;
- verification failures;
- duplicate rate;
- queue lag;
- send latency;
- provider status;
- delivery lag;
- unknown outcomes;
- retry age.

## 15. Acceptance

The adapter is complete when protocol behavior, tenant binding, dedupe, delivery uncertainty and provider outage isolation are independently testable.
