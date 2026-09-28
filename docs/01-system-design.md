# OmniLinks Software Design

## 1. Scope

This is the target software architecture. The repository is currently a scaffold; implementation status is tracked separately and must not be confused with this design.

Echo is an implementation reference only. Echo does not define OmniLinks domain boundaries.

## 2. Architecture style

Start with a modular monolith.

Reason:
- the product needs strong domain separation
- distributed systems complexity is not yet justified
- shared transactions are useful during early product formation

Services are extracted only when a demonstrated independent scaling, security, deployment or failure-domain requirement exists.

## 3. Runtime

    Web / Widget / External API
              |
              v
        HTTP + Realtime
              |
              v
        Application layer
              |
      +-------+--------+---------+
      |       |        |         |
    Domain  Jobs     Events   Providers
      |       |        |         |
      +-------+--------+---------+
              |
        PostgreSQL source
              |
       +------+------+------+
       |      |             |
     Redis  Object store  Vector index

## 4. Layers

Presentation:
Next.js applications and customer-facing widget/embed.

API:
routing, authentication, request context, validation and response mapping.

Application:
use cases and orchestration.

Domain:
business invariants and policies.

Infrastructure:
PostgreSQL, Redis, object storage, vector search, event delivery, provider adapters and observability.

## 5. Canonical modules

- tenancy
- identity
- access
- clients
- programs
- sectors
- teams
- workforce
- customers
- conversations
- channels
- knowledge
- ai
- actions
- workflows
- quality
- analytics
- integrations
- billing
- notifications
- audit

## 6. Dependency rules

1. UI does not access persistence.
2. Domain modules do not depend on UI.
3. Provider SDKs stay behind adapters.
4. AI provider implementations stay behind the AI runtime.
5. Shared packages do not import applications.
6. Circular dependencies are prohibited.
7. Sensitive state transitions use application services/commands rather than arbitrary table writes.

## 7. Request lifecycle

    request
      -> request ID
      -> authenticate
      -> resolve organization
      -> resolve operating scope
      -> authorize
      -> validate
      -> execute use case
      -> transaction
      -> outbox event if needed
      -> response

## 8. Transactional events

For events that must not be lost:

    DB transaction
      + business mutation
      + outbox row
    commit
      -> dispatcher
      -> consumers

The event bus is derived infrastructure, not the source of truth.

## 9. Async execution

Use workers for:
- webhooks
- outbound delivery
- AI execution
- document ingestion
- embeddings
- workflows
- notifications
- analytics aggregation
- usage aggregation
- billing synchronization

Each job needs idempotency, retry classification, timeout, observability and recovery/dead-letter behavior.

## 10. Realtime

Realtime is transport only.

    authoritative state
      -> domain event
      -> realtime publisher
      -> SSE/WebSocket
      -> client

Clients can reconnect and rebuild from APIs.

## 11. Security planes

Platform plane:
internal OmniLinks operations.

Tenant plane:
organization operations.

Customer plane:
external customer interaction.

Platform staff do not automatically inherit customer-data visibility.

## 12. Tenant isolation

Use:
- explicit organization ownership
- server authorization
- hierarchy validation
- PostgreSQL RLS defense in depth
- automated cross-tenant tests

## 13. Future extraction candidates

Likely candidates if scale warrants:
- AI runtime
- channel gateway
- workflow engine
- analytics pipeline
- voice/media processing

Extraction is justified by evidence, not by a preference for microservices.
