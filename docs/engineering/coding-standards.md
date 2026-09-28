# Coding Standards — Implementation Specification

> Status: **Target engineering contract**

## 1. Dependency Direction

~~~mermaid
flowchart TB
TRANSPORT[HTTP / Event / Worker Adapter] --> APP[Application Service]
APP --> DOMAIN[Domain]
APP --> PORTS[Ports]
DOMAIN --> PORTS
INFRA[Infrastructure] --> PORTS
INTEGRATIONS[Integrations] --> PORTS
~~~

The dependency rule is one-directional:

~~~text
transport -> application -> domain -> ports
infrastructure/integrations -> ports
~~~

Domain code does not import HTTP, database drivers or provider SDKs.

## 2. Module Ownership

Every module must declare:

- public commands;
- public queries;
- domain events;
- owned persistence;
- external ports;
- dependencies.

Internal implementation details remain private to the module.

## 3. Input Validation

Validate all untrusted boundaries:

- HTTP;
- webhooks;
- queue messages;
- API clients;
- tool arguments;
- document imports;
- provider callbacks.

Validation happens before authorization-sensitive mutations and before expensive work.

## 4. Errors

Use stable error classes/categories.

Example:

~~~text
ValidationError
AuthorizationError
ConflictError
NotFoundError
RateLimitedError
UpstreamTimeoutError
UpstreamUnavailableError
UnknownOutcomeError
~~~

HTTP/event adapters map these to external contracts.

## 5. Transactions

A transaction should contain only the database state that must commit atomically.

Good:

~~~text
message
+
outbox
+
idempotency record
COMMIT
~~~

Bad:

~~~text
BEGIN
LLM call
provider call
human wait
COMMIT
~~~

## 6. Concurrency

Choose a mechanism based on the invariant:

| Problem | Control |
|---|---|
| duplicate event | unique constraint |
| stale edit | optimistic version |
| active assignment | row lock/transaction |
| quota race | atomic reservation |
| worker duplicate | lease + idempotency |
| provider write timeout | reconciliation |

## 7. Provider Adapters

Canonical methods should hide provider differences:

~~~text
verifyWebhook
normalizeInbound
sendMessage
normalizeDelivery
checkHealth
~~~

Provider-specific request/response types never cross the adapter boundary.

## 8. Logging

Structured logs contain safe metadata:

- request ID;
- correlation ID;
- organization ID where appropriate;
- operation;
- outcome;
- latency;
- error class.

Never log credentials or unnecessary customer content.

## 9. Configuration

Validate required configuration at startup.

Environment-specific configuration stays outside domain logic.

## 10. Naming

Names reflect business meaning.

Prefer:

~~~text
ConversationAssignmentService
EntitlementCheck
RoutingDecision
~~~

Avoid:

~~~text
Helper
Manager
Utils
Service2
~~~

## 11. State Machines

State transitions belong in one authoritative domain operation.

Do not allow arbitrary status assignment from controller code.

## 12. Testing

Every new invariant has direct tests.

Security boundaries need negative tests.

Provider adapters need fixtures/sandbox coverage.

Concurrency-sensitive behavior has race tests.

## 13. Documentation

Behavior changes update the affected:

- requirement;
- domain contract;
- API/event contract;
- test;
- release notes/operational doc where needed.

## 14. Acceptance

Code is compliant when business semantics have clear ownership and infrastructure details cannot leak upward into domain logic.
