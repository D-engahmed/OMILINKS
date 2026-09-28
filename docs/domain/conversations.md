# Conversations Domain — Implementation Specification

> Status: **Target implementation blueprint**

Conversation is the canonical operational aggregate connecting customer identity, messages, channels, workforce control, AI, workflows, delivery and quality.

## 1. Aggregate

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ CONVERSATION : owns
    CUSTOMER ||--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ ASSIGNMENT : records
    CONVERSATION ||--o{ DELIVERY : tracks
    CONVERSATION ||--o{ ATTACHMENT : contains
~~~

## 2. Conversation Record

Minimum fields:

~~~text
conversation_id
organization_id
customer_id
status
control_owner
control_version
channel
priority
last_message_at
sla_deadline_at
version
created_at
updated_at
resolved_at
~~~

Status and control owner are separate fields because they answer different questions.

## 3. Control Model

Control owner:

~~~text
HUMAN
AI
QUEUE
~~~

This controls who may produce autonomous/customer-visible actions at a given point.

## 4. Conversation Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> ASSIGNED
    ASSIGNED --> WAITING_CUSTOMER
    WAITING_CUSTOMER --> ASSIGNED
    ASSIGNED --> PENDING_REVIEW
    PENDING_REVIEW --> ASSIGNED
    ASSIGNED --> RESOLVED
    RESOLVED --> REOPENED
    REOPENED --> ASSIGNED
    OPEN --> SPAM
    SPAM --> [*]
~~~

Transitions are domain commands rather than arbitrary field updates.

## 5. Message Record

Conceptual fields:

~~~text
message_id
conversation_id
direction
author_type
content
content_type
provider_message_id
client_message_id
status
occurred_at
created_at
version
~~~

Messages are append-oriented facts.

Edits/redactions preserve history where the product/legal model requires it.

## 6. Inbound Transaction

~~~mermaid
sequenceDiagram
participant P as Provider
participant W as Webhook
participant D as Conversation Domain
participant DB as PostgreSQL
participant O as Outbox
participant Q as Queue
P->>W: Verified provider event
W->>D: Normalized message
D->>DB: Persist canonical message
D->>O: Persist message event
DB-->>D: Commit
D->>Q: Queue processing
W-->>P: Acknowledge
~~~

AI inference never belongs in the webhook transaction.

## 7. Dedupe

Recommended key:

~~~text
organization
+ provider
+ provider_account
+ provider_message_id
~~~

At the integration boundary, provider event IDs can provide an earlier dedupe layer.

## 8. Outbound Creation

~~~text
authorize send
 -> create canonical outbound message
 -> create delivery job/outbox
 -> COMMIT
 -> send provider request asynchronously
~~~

Canonical creation and provider delivery are intentionally separate.

## 9. Delivery State

~~~mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> QUEUED
    QUEUED --> SENDING
    SENDING --> SENT
    SENT --> DELIVERED
    SENT --> FAILED
    FAILED --> RETRYING
    RETRYING --> SENDING
    SENDING --> UNKNOWN
    UNKNOWN --> RECONCILING
    RECONCILING --> SENT
    RECONCILING --> FAILED
~~~

UNKNOWN exists because a network timeout does not prove that the provider did not send.

## 10. Human Takeover Race

The conversation control version is monotonic.

~~~text
AI starts with control version 41
human takeover -> version 42
AI resumes with version 41
=> stale continuation
=> customer send rejected
~~~

This check happens immediately before the side effect.

## 11. Assignment

Assignment history records:

~~~text
assignment_id
conversation_id
workforce_member_id
team/queue
reason
assigned_by
assigned_at
released_at
routing_decision_id
~~~

Assignment races require a transaction/version strategy.

## 12. Attachments

Metadata:

~~~text
attachment_id
message_id
object_key
mime_type
size
checksum
provider_media_id
processing_state
~~~

Binary content belongs in object storage.

## 13. SLA

Conversation SLA data can include:

~~~text
first_response_deadline
resolution_deadline
priority
sla_policy_version
~~~

SLA calculations reference the policy version used.

## 14. Concurrency Cases

Critical races:

- duplicate inbound message;
- simultaneous assignment;
- human takeover vs AI send;
- resolve vs reopen;
- duplicate outbound retry.

Each has explicit idempotency or transaction protection.

## 15. Failure Modes

| Failure | Behavior |
|---|---|
| duplicate inbound | idempotent |
| stale AI send | reject |
| provider timeout | unknown + reconcile |
| provider 429 | retry queue |
| assignment race | conflict/re-evaluate |
| closed conversation | reject incompatible mutation |
| attachment failure | message preserved; attachment failed |
| event publication failure | outbox retry |

## 16. Cross-Domain Contracts

Customer owns identity.

Routing selects owner.

Workforce changes operational control.

AI executes under policy.

Tools perform bounded business actions.

Quality samples conversation evidence.

Billing consumes usage facts.

## 17. Test Vectors

- duplicate webhook;
- duplicate outbound request;
- two simultaneous assignments;
- takeover during AI generation;
- timeout after provider send;
- resolve during worker execution;
- reopen race;
- attachment failure;
- cross-tenant conversation ID;
- unauthorized outbound send.

## 18. Acceptance

A conversation implementation is complete only when message dedupe, control races, delivery uncertainty, assignment concurrency and tenant isolation are independently proven.
