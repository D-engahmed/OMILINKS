# Integration Architecture — Shared Adapter Contract

> Status: **Target integration engineering contract**

## 1. Adapter Boundary

Every external provider follows:

~~~text
Provider Protocol
 -> Adapter
 -> Canonical Integration Contract
 -> Application/Domain
~~~

## 2. Shared Adapter Interface

Conceptual:

~~~text
verifyInbound(request): VerificationResult
normalizeInbound(payload): CanonicalEvent[]
send(request): ProviderSendResult
normalizeDelivery(payload): DeliveryUpdate
checkHealth(): ProviderHealth
~~~

Provider-specific SDK objects stay inside the adapter.

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
~~~

## 4. Common Reliability Contract

Every adapter documents:

- authentication;
- idempotency;
- rate limits;
- timeout behavior;
- unknown side effects;
- retry policy;
- reconciliation;
- delivery state mapping.

## 5. Credential Contract

Adapters receive credential references, not plaintext credentials from business logic.

## 6. Isolation

Each provider has independent:

- queue/concurrency where needed;
- health state;
- retry policy;
- metrics;
- dead-letter stream.

One provider cannot starve unrelated channels.

## 7. Testing

Common contract tests:

- invalid authentication;
- valid event;
- duplicate event;
- malformed payload;
- timeout;
- rate limit;
- unknown outcome;
- credential failure;
- tenant binding;
- delivery update.

## 8. Acceptance

A provider integration is complete only when it satisfies the shared adapter contract and provider-specific failure semantics are documented.
