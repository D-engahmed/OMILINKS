# Event Catalog

> Status: **Implemented Phase 5 runtime contract**

Events connect transactional domain changes to asynchronous workers, AI, billing, quality, analytics and external integrations.

The fundamental rule is: PostgreSQL remains the source of truth; events communicate facts or work derived from that truth.

## 1. Event Types

Domain events describe something that happened:

- organization.created
- membership.changed
- customer.created
- customer.identity.matched
- conversation.created
- conversation.message.received
- conversation.message.sent
- conversation.assignment.changed
- subscription.changed
- quality.evaluation.completed

Work events request asynchronous processing:

- ai.run.requested
- workflow.run.requested
- knowledge.ingestion.requested

Do not use a work request as evidence that the work succeeded.

## 2. Canonical Envelope

Every event includes:

| Field | Meaning |
|---|---|
| event_id | globally unique identity |
| event_type | stable semantic name |
| version | schema version |
| occurred_at | business occurrence time |
| organization_id | tenant scope |
| actor | human/service/system origin |
| correlation_id | end-to-end trace |
| causation_id | immediate predecessor |
| data | typed business payload |
| metadata | bounded diagnostic metadata |

## 3. Canonical Catalog

| Event | Producer | Consumers |
|---|---|---|
| organization.created | tenancy | provisioning, audit |
| membership.changed | identity | authorization, audit |
| customer.created | customers | analytics, CRM |
| conversation.created | conversations | routing |
| conversation.message.received | conversations/integrations | routing, AI, workflow |
| conversation.message.sent | conversations | delivery, billing |
| conversation.assignment.changed | workforce/routing | SLA, analytics |
| conversation.queue.entered | workforce/routing | queue workers, analytics |
| ai.run.requested | AI/conversation | AI runtime |
| ai.run.completed | AI runtime | quality, usage |
| tool.invocation.completed | tools | audit, analytics |
| workflow.run.requested | workflow | worker runtime |
| workflow.run.completed | workflow | analytics, chaining |
| quality.evaluation.completed | quality | remediation |
| subscription.changed | billing | entitlements |
| usage.recorded | billing | finance, analytics |
| integration.webhook.received | integrations | normalization |
| integration.delivery.updated | integrations | conversation delivery |

## 4. Inbound Message Causality

~~~mermaid
sequenceDiagram
participant P as Provider
participant I as Integration
participant C as Conversation
participant O as Outbox
participant B as Event Bus
participant R as Routing
participant A as AI Runtime
P->>I: Webhook
I->>C: Canonical message
C->>O: conversation.message.received
O->>B: Publish
B->>R: Route work
R->>A: ai.run.requested
~~~

Webhook handling should not execute AI inference in the inbound HTTP transaction.

## 5. Outbox Pattern

The transactional operation is:

1. begin database transaction;
2. write business state;
3. write outbox event;
4. commit;
5. publish asynchronously.

This prevents the database from committing while event publication is lost.

## 6. Event Idempotency

Every consumer must tolerate repeated delivery.

Minimum consumer key:

~~~text
consumer_id + event_id
~~~

Provider integrations create stable dedupe keys before emitting canonical events.

## 7. Ordering

Global ordering is not required.

Ordering is defined per aggregate when business correctness needs it:

- conversation_id;
- workflow_run_id;
- subscription_id.

Consumers that need message order should partition by conversation.

## 8. Causality and Tracing

Example chain:

~~~text
provider webhook
 -> conversation.message.received
 -> ai.run.requested
 -> ai.run.completed
 -> conversation.message.sent
~~~

correlation_id links the operation. causation_id identifies the immediate trigger.

## 9. Payload Rules

Events should be:

- bounded;
- versioned;
- tenant-scoped;
- schema validated;
- safe to retry;
- free of credentials.

Large media/documents should be referenced by durable storage IDs rather than embedded directly in an event.

## 10. Versioning

Additive compatible changes can remain in a version. Changing the meaning of an existing field requires a new version.

Example:

~~~text
conversation.message.received.v1
conversation.message.received.v2
~~~

Consumers declare supported versions.

## 11. Replay

~~~mermaid
flowchart TD
EVENT[Original Event] --> STORE[Event History]
STORE --> REQUEST[Replay Request]
REQUEST --> AUTH[Operator Authorization]
AUTH --> VALIDATE[Replay Validation]
VALIDATE --> CONSUMER[Target Consumer]
CONSUMER --> IDEM[Idempotency]
IDEM --> EFFECT[Side Effect]
REQUEST --> AUDIT[Replay Audit]
~~~

Replay creates a new processing attempt while preserving the original event history.

## 12. Dead Letters

Dead-letter state contains:

- event ID;
- organization;
- consumer;
- consumer version;
- attempt count;
- last error;
- first/last failure time;
- replay state.

## 13. Cross-Domain Rules

AI events do not directly become financial truth unless billing explicitly accepts them as usage facts.

Customer-created events do not grant authorization.

Subscription changes can trigger entitlement refresh, but each consumer owns its own reaction.

## 14. Phase 5 Runtime

Current execution path:

```text
business transaction
  -> outbox_events
  -> outbox publisher
  -> event_inbox fan-out per consumer
  -> leased worker
  -> handler
  -> PROCESSED
  -> retry / DEAD
  -> operator replay
```

`event_inbox` is the durable per-consumer execution state. Its `(organization_id, consumer_id, event_id)` uniqueness rule prevents duplicate work for a consumer. Processing rows carry leases so crashed workers can be reclaimed after expiry.

The first real consumer is `routing-worker`. It reacts to `conversation.message.received` and `conversation.queue.entered` only when the conversation is still under queue control.

Phase 5 is PostgreSQL-backed. Kafka or another external broker is deliberately deferred until throughput, fan-out, or deployment topology requires it.

## 15. Acceptance Criteria

- Business state and required outbox event commit atomically.
- Duplicate deliveries cannot duplicate side effects.
- Per-aggregate ordering is explicit where needed.
- Event versions are traceable.
- Replay preserves history.
- Dead letters are searchable.
- Secrets are excluded.