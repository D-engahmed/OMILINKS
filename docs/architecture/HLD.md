# High-Level Architecture

> Status: **Target production architecture**

## 1. Architectural Position

OMILINKS starts as a modular monolith because the dominant complexity is domain correctness, not network distribution.

The first goal is:

~~~text
strong domain boundaries
+
transactional consistency
+
clear asynchronous seams
+
provider isolation
~~~

Microservice extraction is an optimization after scale/organizational evidence, not an architectural prerequisite.

## 2. System Context

~~~mermaid
flowchart TB
CUSTOMER[Customer] --> CHANNELS[Channel Providers]
OPERATOR[Operations User] --> WEB[Operations Web]
ADMIN[Administrator] --> WEB
WEB --> API[OMILINKS API]
WIDGET[Customer Widget] --> API

CHANNELS --> API
API --> DOMAIN[Domain Modules]
DOMAIN --> DB[(PostgreSQL)]
DOMAIN --> OUTBOX[Transactional Outbox]
OUTBOX --> BUS[Event / Job Bus]
BUS --> WORKERS[Worker Runtime]

WORKERS --> AI[AI Runtime]
AI --> MODELS[Model Providers]
WORKERS --> PROVIDERS[Channel / Payment / Automation Providers]
AI --> KNOW[Knowledge / Search]
AI --> TOOLS[Tool Runtime]

DOMAIN --> QUALITY[Quality]
DOMAIN --> BILLING[Billing]
DOMAIN --> ANALYTICS[Analytics]
~~~

## 3. Major Runtime Components

| Component | Responsibility |
|---|---|
| Operations Web | human-facing management/operations interface |
| Customer Widget | embeddable customer-facing interface |
| Backend API | authentication, tenant resolution, application services |
| Domain Modules | business invariants and transactional use cases |
| Worker Runtime | async events, workflows, integrations and AI jobs |
| PostgreSQL | authoritative transactional state |
| Queue/Event Bus | durable asynchronous delivery |
| Object Storage | documents/media/exports |
| Search/Vector | derived retrieval index |
| AI Runtime | bounded model/tool execution |
| Provider Adapters | external system protocol isolation |
| Observability | logs, metrics, traces, audit |

## 4. Domain Boundaries

The first-class domains are:

~~~text
tenancy
identity
customers
conversations
workforce
routing
ai
knowledge
tools
workflows
quality
billing
integrations
audit
analytics
~~~

A module can depend on another module's public application contract/event. It should not import its internal persistence implementation.

## 5. Sync vs Async Boundary

Use synchronous operations for fast transactional decisions:

- authenticate;
- authorize;
- load current state;
- create canonical customer;
- create conversation;
- create assignment;
- update configuration.

Use asynchronous processing for:

- AI inference;
- provider callbacks;
- outbound delivery;
- workflow timers;
- document ingestion;
- evaluation jobs;
- analytics projections;
- payment reconciliation.

## 6. Canonical Customer Message Flow

~~~mermaid
sequenceDiagram
participant P as Provider
participant API as API/Webhook
participant DOM as Conversation Domain
participant DB as PostgreSQL
participant BUS as Event Bus
participant R as Routing
participant AI as AI Runtime
participant W as Workforce
P->>API: Provider event
API->>DOM: Normalize + ingest
DOM->>DB: Persist message
DOM->>DB: Persist outbox event
DB-->>DOM: Commit
BUS->>R: Message received
R->>AI: AI assignment when eligible
R->>W: Human assignment when required
AI->>DOM: Outbound message request
DOM->>DB: Persist outbound message
AI-->>BUS: AI run completed
~~~

Webhook acknowledgement never waits for this entire flow.

## 7. Data Ownership

PostgreSQL owns:

- organization;
- memberships;
- customers;
- conversations;
- messages;
- assignments;
- AI configuration/run metadata;
- workflow state;
- quality;
- billing;
- usage;
- audit.

Derived systems own:

- embeddings;
- search index;
- caches;
- analytics projections.

## 8. AI Boundary

The AI Runtime is behind an application boundary.

~~~mermaid
flowchart LR
CONV[Conversation] --> RUN[AI Run]
RUN --> POLICY[Policy Resolver]
POLICY --> ROUTER[Model Router]
RUN --> CTX[Context Builder]
CTX --> KNOW[Knowledge]
RUN --> GUARD[Guardrails]
GUARD --> TOOL[Tool Runtime]
TOOL --> DOMAIN[Domain Services]
DOMAIN --> DB[(PostgreSQL)]
~~~

The model cannot bypass Tool Runtime or Domain Services.

## 9. Event Boundary

The outbox is the bridge between transactional state and asynchronous consumers.

~~~text
domain transaction
 -> outbox event
 -> bus
 -> consumers
 -> derived state / external side effect
~~~

## 10. Failure Isolation

External provider failure should not corrupt canonical state.

Examples:

~~~text
WhatsApp down
 -> WhatsApp degraded
 -> queued outbound
 -> Telegram/SMS continue
~~~

Similarly:

~~~text
Model provider down
 -> routing/fallback/handoff
 -> conversation remains accessible
~~~

## 11. Scaling Path

Initial:

~~~text
1 API deployment
1 worker deployment
managed PostgreSQL
managed queue/redis
object storage
~~~

Scale independently:

~~~text
API replicas
worker replicas
AI worker pool
webhook workers
workflow workers
analytics consumers
~~~

Split into services only when ownership, load or failure isolation justifies it.

## 12. Architecture Invariants

- PostgreSQL is transactional truth.
- Tenant authorization occurs before data access.
- External providers are adapters.
- Events are at-least-once.
- Side effects are idempotent/reconciled.
- AI is policy constrained.
- Billing is backend authoritative.
- Derived stores can be rebuilt.

## 13. Acceptance Criteria

- Domain boundaries are enforceable in code structure.
- Sync/async boundaries are explicit.
- AI cannot bypass domain/tool authorization.
- Provider outages are isolated.
- Transactional state is separated from derived data.
- Scaling can occur independently for API and workers.
