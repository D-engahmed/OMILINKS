# Instagram Integration — Implementation Specification

> Status: **Target provider-adapter blueprint**

## 1. Boundary

Instagram payloads are parsed exclusively by InstagramAdapter.

Core domains receive canonical message/customer/conversation commands.

## 2. Connection

~~~text
organization
provider_account
credential_ref
webhook_config
status
capabilities
health
~~~

## 3. Inbound

~~~mermaid
sequenceDiagram
participant P as Instagram
participant A as Adapter
participant D as Dedupe Store
participant I as Identity
participant C as Conversation
P->>A: Signed callback
A->>A: Verify
A->>D: Check event
D-->>A: New
A->>I: Resolve identity
I-->>A: Customer
A->>C: Canonical message
A-->>P: Accepted
~~~

## 4. Thread Semantics

Provider thread IDs are external references.

The internal Conversation ID is authoritative for:

- lifecycle;
- assignment;
- AI/human control;
- SLA;
- quality.

## 5. Identity

Uniqueness is provider/account scoped:

~~~text
organization
+ provider account
+ external user ID
~~~

Weak matches require review.

## 6. Capabilities

Adapter exposes a capability profile such as:

~~~text
text
media
reaction
delivery callback
interactive
~~~

The application checks capability before attempting unsupported operations.

## 7. Outbound

~~~text
canonical message
 -> delivery job
 -> adapter
 -> provider
 -> normalized delivery event
~~~

## 8. Idempotency

Duplicate webhook/update cannot create multiple canonical messages.

Outbound retries require provider-safe dedupe or reconciliation.

## 9. Failure

| Failure | Behavior |
|---|---|
| invalid verification | reject |
| duplicate event | no-op |
| rate limit | retry queue |
| provider timeout | reconcile |
| credential revoked | degrade connection |
| unsupported operation | deterministic capability error |

## 10. Security

Provider account identity never determines tenant authorization.

All customer/conversation access is organization-scoped.

## 11. Testing

- verification;
- duplicate update;
- identity mapping;
- unsupported capability;
- outbound timeout;
- rate limit;
- credential failure;
- tenant isolation.

## 12. Observability

Track ingress, dedupe, outbound latency, provider errors, retries, queue lag and connection health.

## 13. Acceptance

Instagram is complete when provider protocol isolation, capability checking, dedupe and failure reconciliation are implemented.
