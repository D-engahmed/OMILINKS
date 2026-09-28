# Event Architecture

> Status: **Target production event architecture**

## 1. Purpose

Event architecture connects transactionally committed facts to asynchronous consumers without making the event system a second source of truth.

## 2. Event Classes

### Domain fact

Something happened.

Examples:

~~~text
customer.created
conversation.message.received
subscription.changed
~~~

### Work request

A worker should perform work.

Examples:

~~~text
ai.run.requested
workflow.run.requested
knowledge.ingestion.requested
~~~

### Integration event

An external boundary changed.

Examples:

~~~text
integration.webhook.received
integration.delivery.updated
~~~

## 3. End-to-End Architecture

~~~mermaid
flowchart TB
APP[Application Service] --> TX[DB Transaction]
TX --> STATE[Business State]
TX --> OUTBOX[Outbox]
OUTBOX --> PUB[Publisher]
PUB --> BUS[Event Bus]
BUS --> ROUTER[Consumer Router]
ROUTER --> AI[AI]
ROUTER --> WF[Workflow]
ROUTER --> BILL[Billing]
ROUTER --> QA[Quality]
ROUTER --> ANALYTICS[Analytics]
ROUTER --> INTEGRATIONS[Integrations]
~~~

## 4. Outbox

The transaction is:

~~~text
BEGIN
  business mutation
  outbox insert
COMMIT
~~~

The publisher later reads pending outbox events.

This ensures event publication does not disappear after a successful business transaction.

## 5. Delivery Guarantee

Event delivery is at least once.

Therefore:

~~~text
consumer(event_id)
must be safe
when called twice
~~~

Exactly-once processing is not assumed across network boundaries.

## 6. Consumer Inbox

For non-idempotent consumers, maintain an inbox/processed-event record:

~~~text
consumer
+ event_id
+ processed_at
+ result_reference
~~~

The consumer can safely recognize duplicate delivery.

## 7. Ordering

Order only where business logic requires it.

Example:

~~~text
conversation A:
message 1
message 2
assignment change
message 3
~~~

Partition consumers by conversation when strict per-conversation sequence is required.

Global ordering is avoided because it limits scale.

## 8. Causality

Use:

- correlation_id for the whole operation;
- causation_id for the direct predecessor.

Example:

~~~text
provider event
 -> conversation.message.received
 -> ai.run.requested
 -> ai.run.completed
 -> conversation.message.sent
~~~

## 9. Event Versioning

Events use explicit schema versions.

Breaking semantics create a new version.

Consumers declare supported versions.

## 10. Retry

Retries are classified:

~~~mermaid
flowchart TD
EVENT[Event] --> HANDLER[Consumer]
HANDLER --> OUTCOME{Outcome}
OUTCOME -->|Success| ACK[Ack]
OUTCOME -->|Transient| RETRY[Retry Queue]
RETRY --> HANDLER
OUTCOME -->|Permanent| DLQ[Dead Letter]
OUTCOME -->|Unknown Side Effect| RECON[Reconcile]
RECON --> SAFE[Known State]
SAFE --> RETRYSAFE[Retry if Safe]
~~~

## 11. Dead Letters

Dead-letter records include:

- tenant;
- event;
- consumer;
- version;
- attempts;
- error;
- timestamps;
- replay state.

Dead letters are operational data, not discarded messages.

## 12. Replay

Replay is permissioned.

~~~mermaid
sequenceDiagram
participant O as Operator
participant S as Event Store
participant R as Replay Service
participant C as Consumer
O->>S: Select failed event
O->>R: Authorize replay
R->>C: Re-deliver
C->>C: Idempotency check
C-->>R: Result
R-->>S: Replay outcome
~~~

Replay must preserve original history.

## 13. Schema Registry

Schemas live in the events schema directory and are tested in CI.

Required fixture classes:

- valid minimal;
- valid full;
- additive fields;
- boundary values;
- invalid;
- tenant mismatch/security case.

## 14. Event Security

Never place:

- passwords;
- API keys;
- bearer tokens;
- raw payment credentials.

Large payloads are stored by durable reference.

## 15. Event Observability

Monitor:

- outbox age;
- publish lag;
- consumer lag;
- retry count;
- dead letters;
- duplicate rate;
- per-consumer failure rate.

## 16. Acceptance Criteria

- Business state and outbox event commit together.
- Delivery is treated as at-least-once.
- Consumers are idempotent.
- Ordering is per aggregate where required.
- Replay preserves history.
- Event versions are explicit.
- Secrets are excluded.
