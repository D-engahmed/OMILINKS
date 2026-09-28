# Low-Level Architecture

> Status: **Target production implementation architecture**

## 1. Layering

Every backend operation should follow:

~~~text
transport
  -> authentication / tenant resolution
    -> authorization
      -> application service
        -> domain logic
          -> persistence
            -> outbox
~~~

External calls occur through integration/tool adapters.

## 2. Package Boundary

Recommended backend layout:

~~~text
packages/backend/src/
  app/
  domain/
    tenancy/
    identity/
    customers/
    conversations/
    workforce/
    routing/
    ai/
    knowledge/
    tools/
    workflows/
    quality/
    billing/
  integrations/
  infrastructure/
  workers/
  api/
~~~

Exact filenames may change, but dependency direction should remain.

## 3. Dependency Direction

~~~mermaid
flowchart TB
API[Transport] --> APP[Application]
APP --> DOMAIN[Domain]
APP --> PORTS[Ports / Interfaces]
DOMAIN --> PORTS
INFRA[Infrastructure] --> PORTS
INTEG[Integrations] --> PORTS
WORKER[Workers] --> APP
~~~

Domain code should not depend directly on provider SDKs.

## 4. Request Lifecycle

~~~mermaid
sequenceDiagram
participant C as Client
participant H as HTTP Handler
participant A as Auth
participant T as Tenant Context
participant Z as Authorization
participant U as Use Case
participant D as Domain
participant R as Repository
participant O as Outbox
C->>H: Request
H->>A: Authenticate
A-->>H: Principal
H->>T: Resolve tenant
T-->>H: Context
H->>Z: Authorize
Z-->>H: Allow
H->>U: Execute
U->>D: Validate invariants
D->>R: Persist
D->>O: Record event
R-->>U: Commit
U-->>H: Result
H-->>C: Response
~~~

## 5. Transaction Boundary

Database transaction begins as close as possible to the actual business mutation.

Do not include:

- LLM calls;
- HTTP calls to providers;
- long file processing;
- human waiting;

inside the transaction.

## 6. Outbox Implementation

Conceptual table:

| Field | Purpose |
|---|---|
| event_id | unique event |
| organization_id | tenant |
| type | event type |
| version | schema |
| aggregate_type | aggregate class |
| aggregate_id | source aggregate |
| payload | serialized event |
| occurred_at | business time |
| published_at | delivery |
| attempts | retry count |
| status | pending/published/dead |

## 7. Repository Rules

Repository interfaces receive organization context when data is tenant-owned.

Preferred:

~~~text
customerRepository.get({
  organizationId,
  customerId
})
~~~

A global get-by-ID API is discouraged for tenant-owned resources.

## 8. Application Service Rules

Application services:

- orchestrate use cases;
- enforce transaction scope;
- call domain rules;
- publish domain events;
- map external/application errors.

They should not become giant "god services."

## 9. Domain Rules

Domain objects/services own:

- state transitions;
- invariants;
- calculations;
- policy interpretation where business-specific.

Pure business rules should be testable without HTTP infrastructure.

## 10. Concurrency

Choose intentionally:

~~~text
unique constraint
optimistic version
atomic update
row lock
idempotency record
~~~

Examples:

- conversation control -> version/lock;
- payment event -> unique provider event;
- usage quota -> atomic reservation/counter;
- assignment -> transaction + concurrency check.

## 11. Integration Ports

Canonical interface examples:

~~~text
ChannelAdapter
PaymentAdapter
SearchAdapter
ModelProvider
SecretProvider
NotificationAdapter
~~~

Infrastructure implements ports.

Business code depends on the contract.

## 12. Worker Architecture

~~~mermaid
flowchart LR
BUS[Queue] --> DISPATCH[Worker Dispatcher]
DISPATCH --> WEBHOOK[Webhook Jobs]
DISPATCH --> AI[AI Jobs]
DISPATCH --> WF[Workflow Jobs]
DISPATCH --> KNOW[Knowledge Jobs]
DISPATCH --> BILL[Billing Jobs]
WEBHOOK --> APP[Application Services]
AI --> APP
WF --> APP
KNOW --> APP
BILL --> APP
~~~

Each worker records attempt/state and uses shared retry policies.

## 13. Error Translation

Provider-specific errors are translated:

~~~text
Provider 429 -> RATE_LIMITED
Provider timeout -> UPSTREAM_TIMEOUT
Provider invalid auth -> PROVIDER_AUTH_FAILED
~~~

Domain/application code should not depend on provider HTTP status meanings.

## 14. Realtime Boundary

If realtime/WebSocket/SSE is introduced:

~~~text
domain mutation
 -> durable state/event
 -> realtime fan-out
~~~

Realtime notifications are derived communication, not the source of truth.

## 15. Testing Boundaries

Test:

- domain independently;
- application with persistence;
- integrations against contract fixtures;
- HTTP against OpenAPI;
- workers with retry/recovery cases.

## 16. Observability Hooks

Application services accept/carry correlation context.

Infrastructure emits:

- request span;
- DB timing;
- provider span;
- queue timing;
- AI run span.

## 17. Acceptance Criteria

- Domain code does not import provider SDKs.
- Tenant context is explicit in data access.
- Transactions exclude slow external calls.
- Worker jobs are durable/retryable.
- Concurrency strategy is documented per critical mutation.
- OpenAPI/events map to application services rather than table CRUD.
