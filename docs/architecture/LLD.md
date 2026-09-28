# Low-Level Architecture — Implementation Blueprint

> Status: **Target production implementation architecture**

## 1. Backend Layers

~~~text
src/
  api/
    routes
    request schemas
    error mapping
  application/
    commands
    queries
    services
    transaction boundaries
  domain/
    aggregates
    entities/value objects
    policies
    domain events
  infrastructure/
    database
    queue
    cache
    observability
    secrets
  integrations/
    whatsapp
    instagram
    facebook
    telegram
    sms
    paymob
    n8n
  workers/
    dispatcher
    ai
    workflow
    integration
    knowledge
    billing
~~~

The exact physical folder names can change. Dependency direction must not.

## 2. Dependency Graph

~~~mermaid
flowchart TB
HTTP[API Routes] --> APP[Application Services]
WORKER[Workers] --> APP
APP --> DOMAIN[Domain]
APP --> PORTS[Ports]
DOMAIN --> PORTS
DB[Database Adapter] --> PORTS
PROVIDER[Integration Adapters] --> PORTS
OBS[Observability Adapter] --> PORTS
~~~

No route should contain business policy that could be called by another trigger.

## 3. Request Pipeline

~~~mermaid
sequenceDiagram
participant C as Client
participant H as Handler
participant A as Auth
participant T as Tenant Context
participant Z as Authorization
participant U as Use Case
participant D as Domain
participant R as Repository
participant O as Outbox
C->>H: HTTP request
H->>A: Authenticate
A-->>H: Principal
H->>T: Resolve organization
T-->>H: Context
H->>Z: Authorize
Z-->>H: Allowed
H->>U: Execute command/query
U->>D: Domain operation
D->>R: Persist
D->>O: Record event
R-->>U: Commit
U-->>H: Result
H-->>C: Response
~~~

## 4. Command Handler Contract

Conceptual:

~~~text
CommandHandler<Command, Result>
  - validate command
  - resolve tenant
  - authorize
  - execute domain operation
  - persist transaction
  - emit outbox
~~~

Handlers should not call providers directly unless that provider call is explicitly part of an application boundary with reconciliation semantics.

## 5. Query Contract

Queries can use optimized read models while preserving authorization.

~~~text
Query
 -> authorization scope
 -> tenant-filtered repository
 -> projection
 -> DTO
~~~

Queries must never use a globally accessible persistence method and "filter later."

## 6. Transaction Boundary

A transaction should contain only database work needed for atomic business state.

Good:

~~~text
create conversation
+ create message
+ create outbox
COMMIT
~~~

Bad:

~~~text
BEGIN
call model
wait 10s
call provider
BEGIN more work
COMMIT
~~~

## 7. Repository Contract

Tenant-owned repository signatures should include ownership context.

~~~text
getCustomer(organizationId, customerId)
listConversations(organizationId, scope, filter)
createAssignment(organizationId, ...)
~~~

This makes missing tenant scope difficult to hide.

## 8. Concurrency Mechanisms

Use the smallest correct primitive:

| Problem | Mechanism |
|---|---|
| duplicate external event | unique constraint |
| stale admin edit | optimistic version |
| active assignment race | transaction/row lock |
| quota race | atomic reservation |
| worker duplication | lease + idempotency |
| provider write timeout | reconciliation |

## 9. Idempotency Store

Mutation idempotency record:

~~~text
namespace
key
request_hash
status
response_body
response_status
created_at
expires_at
~~~

Same namespace/key with different request_hash is a conflict.

## 10. Outbox Record

~~~text
event_id
aggregate_type
aggregate_id
organization_id
event_type
version
payload
occurred_at
published_at
attempts
status
last_error
~~~ 

The publisher never deletes evidence needed for replay without retention policy.

## 11. Worker Dispatcher

~~~mermaid
flowchart LR
QUEUE[Queue] --> DISPATCH[Dispatcher]
DISPATCH --> AI[AI Queue]
DISPATCH --> WF[Workflow Queue]
DISPATCH --> INT[Integration Queue]
DISPATCH --> KNOW[Knowledge Queue]
DISPATCH --> BILL[Billing Queue]
AI --> WORKER[Worker Pool]
WF --> WORKER
INT --> WORKER
KNOW --> WORKER
BILL --> WORKER
~~~

Different classes may use separate concurrency pools to prevent noisy-neighbor effects.

## 12. Error Translation

Provider-specific errors become canonical classes:

~~~text
429 -> RATE_LIMITED
timeout -> UPSTREAM_TIMEOUT
5xx -> UPSTREAM_UNAVAILABLE
invalid credentials -> PROVIDER_AUTH_FAILED
~~~

Domain code must not depend on provider HTTP implementation details.

## 13. Realtime

Realtime notifications are derived from committed events:

~~~text
transaction
 -> durable event
 -> realtime fan-out
~~~

SSE/WebSocket failure does not roll back the domain transaction.

## 14. Observability

Every application command receives correlation context.

Trace chain:

~~~text
HTTP request
 -> application command
 -> DB transaction
 -> outbox
 -> worker
 -> provider
~~~

## 15. Test Boundaries

- domain tests: pure invariant behavior;
- application tests: use case + persistence;
- adapter tests: provider contract;
- HTTP tests: API semantics;
- worker tests: retry/recovery;
- security tests: cross-tenant/authorization.

## 16. Acceptance

The low-level design is complete when code can be organized without ambiguous ownership of business logic or infrastructure calls.
