# OMNILINKS Software Design — v1

## 1. Purpose

OMNILINKS is a multi-tenant customer-operations platform with two operating modes:

1. Direct operator: a business runs its own customer operations.
2. Service provider: a BPO/contact-center/managed-service organization operates programs for multiple client businesses.

A tenant can contain many users, teams, programs and sectors. Sector applications are specialized operator workspaces. Tenant administration and OMNILINKS platform administration are separate security domains. Human and AI workers participate in one workforce model.

Echo is a reference for useful product patterns only. Convex is not part of the OMNILINKS backend architecture.

## 2. Core architectural decisions

### 2.1 Modular monolith first

The backend starts as one runtime with explicit internal domain boundaries.

~~~
packages/backend
  tenancy
  identity
  access
  clients
  programs
  sectors
  teams
  workforce
  customers
  conversations
  channels
  knowledge
  ai
  actions
  workflows
  quality
  billing
  analytics
~~~

We do not introduce microservices until a module demonstrates an independent scaling, security, deployment, or failure-domain requirement.

### 2.2 Source of truth

PostgreSQL is the authoritative business datastore. Redis, vector search, object storage, event streams and analytics projections are supporting or derived systems.

### 2.3 Server-side authorization

The frontend may hide unavailable capabilities, but it is never the security boundary.

Every protected command follows:

~~~
identity
 -> tenant context
 -> operating scope
 -> permissions
 -> resource policy
 -> action
~~~

### 2.4 Tenant isolation

Every tenant-owned resource must have an explicit ownership path to its tenant. Application authorization is mandatory. PostgreSQL Row-Level Security is defense in depth for selected and high-risk tables.

PostgreSQL row policies can restrict which rows are visible or writable, including USING and WITH CHECK policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

### 2.5 AI as workforce

AI agents are governed workers, not privileged infrastructure. They can receive work, read permitted context, invoke permitted tools, escalate and be audited.

### 2.6 Channels as adapters

Channel providers are isolated behind a common adapter contract. Core conversation logic does not branch on vendor-specific payloads.

## 3. Monorepo boundaries

~~~
apps/
  tenant-admin/
  platform-admin/
  support/
  sales/
  quality/
  workforce/
  collections/
  operations/
  widget/
  embed/

packages/
  backend/
  database/
  contracts/
  auth/
  rbac/
  ai/
  channels/
  realtime/
  jobs/
  observability/
  config/
  ui/
  typescript-config/
  eslint-config/
~~~

### 3.1 Application rule

An apps/* package is a user-facing product workspace with its own UI, navigation, route tree, authorization-aware UX and deployment boundary.

Core applications:
- tenant-admin — tenant configuration, users, teams, permissions, channels, billing and governance.
- platform-admin — internal OMNILINKS operations, security, platform health and provider operations.
- support — customer-service operations.
- sales — sales operations.
- quality — QA and quality operations.
- workforce — workforce-management operations.
- collections — collections and recovery operations.
- operations — back-office operations.
- widget — end-customer experience.
- embed — website loader/bootstrap.

A tenant does not get a separate deployed copy of an app. One application serves many tenants; authorization and configuration determine visibility and behavior.

### 3.2 Package rule

A packages/* package is a platform capability or shared system.

The backend remains at packages/backend by OMNILINKS repository convention even though it is executable. Applications communicate with it through APIs and contracts and do not import backend internals.

## 4. Business-to-software hierarchy

~~~
OMNILINKS Platform
      |
    Tenant
      |
  +---+-------------------------------+
  |                                   |
Direct operator                 Service provider
  |                                   |
  |                             Client Account
  |                                   |
  |                                Program
  |                                   |
  +---------------+-------------------+
                  |
                Sector
                  |
                Team
                  |
        Human / AI Workforce
~~~

Core entities:

| Entity | Purpose |
|---|---|
| Tenant | Contracting organization and security boundary |
| User | Human identity |
| TenantMembership | User membership in a tenant |
| Role | Permission bundle |
| Permission | Atomic authorization capability |
| ClientAccount | Client business served by a service-provider tenant |
| Program | Operational engagement for a client |
| Sector | Operational workspace/domain |
| Team | Execution unit inside a sector |
| WorkforceMember | Human or AI worker |
| Customer | External end customer |
| ChannelIdentity | Customer identity on a channel |
| Conversation | Unified interaction |
| Message | Individual inbound/outbound communication |
| Agent | Configured AI worker |
| KnowledgeBase | Authorized knowledge boundary |
| Action | Business operation callable by human or AI workflow |
| Workflow | Event/condition/action automation |
| AuditEvent | Security and operational evidence |

A sector may be tenant-wide or program-scoped. The database must make the scope explicit and enforce it.

## 5. Tenant, sector and app authorization

A user can belong to multiple sectors and teams:

~~~
User
  +-- TenantMembership
  +-- SectorMembership
  +-- TeamMembership
  +-- Roles
  +-- Permissions
~~~

The same user may have permissions such as support.read, support.reply and quality.review and therefore access multiple applications.

The application is a UX boundary, not an authorization shortcut. Every API request re-checks tenant, sector, team and resource scope.

## 6. Backend modular-monolith structure

~~~
packages/backend/
└── src/
    ├── server/
    ├── http/
    │   ├── routes/
    │   ├── middleware/
    │   └── errors/
    ├── application/
    │   ├── tenancy/
    │   ├── identity/
    │   ├── access/
    │   ├── clients/
    │   ├── programs/
    │   ├── sectors/
    │   ├── teams/
    │   ├── workforce/
    │   ├── customers/
    │   ├── conversations/
    │   ├── channels/
    │   ├── knowledge/
    │   ├── ai/
    │   ├── actions/
    │   ├── workflows/
    │   ├── quality/
    │   ├── analytics/
    │   └── billing/
    └── infrastructure/
        ├── persistence/
        ├── cache/
        ├── events/
        ├── storage/
        ├── providers/
        └── observability/
~~~

HTTP routes stay thin:

~~~
Request
 -> authentication
 -> tenant/scope resolution
 -> authorization
 -> validation
 -> application service
 -> response mapping
~~~

Business rules belong in application/domain modules, not route handlers.

## 7. Package dependency rules

~~~
apps/*
   |
   +--> packages/ui
   +--> packages/contracts
   |
   +--> backend API

packages/backend
   |
   +--> database
   +--> auth
   +--> rbac
   +--> ai
   +--> channels
   +--> realtime
   +--> jobs
   +--> observability
   +--> config
~~~

Rules:
1. Apps never access PostgreSQL directly.
2. Apps never import backend internals.
3. Backend never imports UI or React code.
4. Provider-specific models stay inside provider adapters.
5. AI providers stay behind an AI abstraction.
6. Shared packages never import applications.
7. Circular dependencies are prohibited.

## 8. Authentication and authorization

Authentication answers who the user is. Authorization answers what that identity may do in an operating scope.

An identity provider can own authentication. OMNILINKS owns tenant membership, client/program scope, sector membership, team membership, roles, permissions and resource policies.

Conceptual principal:

~~~
Principal {
  userId
  sessionId
  authProvider
}
~~~

Authorization evaluates the principal against the requested action, resource and scope.

## 9. Channel architecture

All channels normalize into platform events:

~~~
Vendor Webhook
      |
Channel Adapter
      |
InboundChannelEvent
      |
Identity Resolution
      |
Customer
      |
Conversation
      |
Message
~~~

Conceptual contract:

~~~ts
interface ChannelAdapter {
  verifyWebhook(input: unknown): Promise<boolean>
  receiveWebhook(input: unknown): Promise<InboundChannelEvent[]>
  sendMessage(input: OutboundMessage): Promise<SendResult>
}
~~~

Planned channels include web, WhatsApp, Instagram, Facebook, Telegram and SMS.

## 10. Unified customer identity

A customer may own multiple channel identities:

~~~
Customer
  +-- WhatsApp
  +-- Instagram
  +-- Facebook
  +-- Telegram
  +-- SMS
  +-- Web
~~~

Identity matching is confidence-aware. Deterministic identifiers may auto-link. Weak matches become candidates for review rather than silently merging customers.

## 11. Conversation and workforce flow

~~~
Inbound
  -> normalize
  -> resolve customer
  -> resolve conversation
  -> persist message
  -> evaluate automation
  -> route work
  -> AI or human handling
  -> action/tool execution
  -> reply or escalation
  -> audit + metrics
~~~

Routing considers tenant, client, program, sector, team/queue, channel, customer attributes, conversation state, language, priority, AI availability and human availability.

## 12. AI architecture

~~~
Conversation
    |
AI Orchestrator
    |
    +-- context builder
    +-- knowledge retrieval
    +-- model router
    +-- agent runtime
    +-- tool policy
    +-- action executor
    +-- usage/cost accounting
    +-- safety/guardrails
~~~

AI agents never receive unrestricted backend access.

~~~
AI tool request
      |
permission/policy check
      |
approval required?
   /          \
 no            yes
 |              |
execute       approval workflow
~~~

Every tool execution is auditable.

## 13. Knowledge and RAG

Knowledge is scoped by tenant and, where required, client, program or sector.

~~~
Document
   -> chunks
   -> embeddings
   -> vector index
~~~

PostgreSQL remains authoritative for ownership, permissions and metadata. Vector stores are retrieval indexes. Authorization filters are applied before retrieved content reaches the model.

## 14. Events and asynchronous work

Initial domain events:

~~~
tenant.created
member.invited
sector.enabled
program.created
message.received
message.sent
conversation.created
conversation.assigned
conversation.escalated
agent.started
agent.completed
tool.executed
action.approval.requested
action.approved
document.ingestion.requested
workflow.triggered
billing.usage.recorded
~~~

The event system is not the business source of truth.

Async jobs include webhook retries, document processing, embeddings, outbound delivery retries, scheduled automation, notifications, analytics aggregation and usage aggregation.

Every externally triggered operation gets timeout, retry, idempotency and dead-letter behavior.

## 15. Realtime

~~~
application event
      |
realtime publisher
      |
SSE / WebSocket
      |
sector application
~~~

Realtime is transport only. Backend/database state is authoritative.

## 16. API contract

Base path: /api/v1

Success:

~~~json
{ "data": {} }
~~~

Error:

~~~json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found",
    "requestId": "..."
  }
}
~~~

API requirements: resource-oriented URLs, explicit pagination, idempotency keys for retriable commands, request IDs, optimistic concurrency on sensitive updates, and authorization before serialization.

## 17. Data architecture

Primary datastore: PostgreSQL.

Supporting systems:
- Redis for cache, rate limiting, coordination, short-lived state and job support.
- Vector database for semantic retrieval.
- Object storage for documents and media.
- Event streaming for durable asynchronous integration.

Do not create a separate database per tenant in the initial architecture. Tenant isolation is logical, explicit and policy-enforced.

## 18. Security and observability

Security controls:
- secure authentication
- tenant/scope authorization
- RLS defense in depth
- secret encryption
- webhook signature verification
- idempotent webhook processing
- rate limiting
- audit logs
- least-privilege AI tools
- approval gates
- prompt-injection defenses
- file validation/scanning
- secret rotation
- dependency/container scanning

Every request and async job carries, where appropriate:

~~~
requestId
traceId
tenantId
principalId
operation
latency
result
error
~~~

Sensitive customer content is not logged by default.

## 19. Initial application portfolio

Create applications for real operator experiences:

~~~
apps/
├── tenant-admin
├── platform-admin
├── support
├── widget
└── embed
~~~

Then add sales, quality, workforce, collections and operations when each workflow has enough distinct behavior to justify a product workspace.

We do not create empty/template applications just to make the repository look complete.

## 20. Implementation sequence

Phase A — platform foundation
1. Backend HTTP runtime.
2. Database package and migrations.
3. Contracts and API conventions.
4. Authentication and tenant context.
5. RBAC and sector/team authorization.

Phase B — administration
6. Tenant administration.
7. Platform administration.
8. User/team/sector management.

Phase C — customer operations
9. Customer and conversation domain.
10. Widget/embed integration.
11. Channel adapter framework.
12. First external channel.

Phase D — AI workforce
13. AI orchestration.
14. Knowledge/RAG.
15. Tool/action policy.
16. Hybrid AI/human routing.

Phase E — BPO operations
17. Client accounts.
18. Programs.
19. Queue/routing operations.
20. Quality.
21. Workforce management.
22. Client-level reporting.

Phase F — commercial/platform maturity
23. Usage billing.
24. Analytics/BI.
25. Security hardening.
26. Managed-service operating capabilities.

## 21. Architectural decision records

### ADR-001 — Own backend
OMNILINKS owns its backend instead of adopting Convex as the primary application backend.

### ADR-002 — Modular monolith
Start with one backend runtime and strong internal boundaries; split services only when demonstrated operational requirements justify it.

### ADR-003 — Apps are workspaces
Separate apps exist for materially different user populations and workflows, not because each tenant needs a separate deployment.

### ADR-004 — Internal authorization model
Authentication may be delegated to an identity provider, but tenant/program/sector/team authorization remains an OMNILINKS domain responsibility.

### ADR-005 — Human and AI workforce
Human and AI workers share operational concepts for assignment, routing, escalation, permissions, audit and performance measurement.

## 22. Design exit criteria

Implementation can proceed when:
- each business entity has one authoritative owner
- each protected resource has a deterministic tenant scope
- each application has a defined audience and domain
- each package has a defined responsibility and dependency direction
- channel payloads are isolated behind adapters
- AI tools/actions have authorization and audit boundaries
- async work has retry and idempotency semantics
- realtime is transport-only
- PostgreSQL remains the business source of truth
- the platform supports direct and service-provider tenants without separate systems