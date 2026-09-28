# Billing Domain — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Financial Responsibility

Billing owns plan, entitlement, subscription, payment, usage and reconciliation state.

The browser is never the financial authority.

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ SUBSCRIPTION : has
    PLAN ||--o{ ENTITLEMENT : grants
    SUBSCRIPTION }o--|| PLAN : uses
    ORGANIZATION ||--o{ USAGE_RECORD : produces
    ORGANIZATION ||--o{ INVOICE : owns
    INVOICE ||--o{ PAYMENT : receives
    PAYMENT ||--o{ PAYMENT_EVENT : records
~~~

## 3. Plan

Plan contains commercial configuration:

~~~text
plan_id
name
status
effective_from
effective_to
currency
price_policy_version
~~~

Do not hardcode commercial limits into frontend components.

## 4. Entitlement

Machine-enforceable limits:

~~~text
users.max
sites.max
customers.max
ai.tokens.period
workflow_runs.period
storage.bytes
channels.max
~~~

Each entitlement specifies unit, limit and reset semantics.

## 5. Subscription Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> TRIALING
    TRIALING --> ACTIVE
    TRIALING --> CANCELED
    ACTIVE --> PAST_DUE
    PAST_DUE --> ACTIVE
    PAST_DUE --> SUSPENDED
    ACTIVE --> CANCELED
    SUSPENDED --> ACTIVE
    SUSPENDED --> CANCELED
~~~

Transitions are domain commands driven by verified billing facts.

## 6. Entitlement Evaluation

~~~mermaid
flowchart TD
REQUEST[Governed Operation] --> SUB[Current Subscription]
SUB --> PLAN[Effective Plan]
PLAN --> ENT[Entitlement]
ENT --> USAGE[Current Usage]
USAGE --> RESERVE[Reserve / Check]
RESERVE --> ALLOW[Allow]
RESERVE --> DENY[Deny / Queue / Upgrade]
~~~

## 7. Reservation vs Measurement

For hard limits:

~~~text
reservation = admission control
usage_record = historical fact
~~~

Do not use a delayed usage aggregate as the sole concurrency control for expensive operations.

## 8. Usage Record

Conceptual fields:

~~~text
usage_record_id
organization_id
metric
quantity
unit
source_event_id
agent_id
conversation_id
run_id
provider
model
pricing_version
occurred_at
~~~

Usage records are append-oriented and idempotent.

## 9. Usage Idempotency

Semantic key example:

~~~text
organization
+ source event
+ meter version
~~~

Duplicate event processing must not double count usage.

## 10. Payment Flow

~~~mermaid
sequenceDiagram
participant U as Browser
participant API as OMILINKS API
participant P as Payment Provider
participant W as Webhook
participant B as Billing
U->>API: Checkout request
API->>P: Create payment
P-->>U: Provider checkout
P->>W: Verified provider event
W->>B: Reconcile payment
B->>B: Transition subscription
B->>B: Recalculate entitlement
~~~

Browser redirect is informational.

## 11. Payment Event

Store:

~~~text
provider_event_id
provider_transaction_id
organization_id
internal_payment_id
verification_result
provider_status
received_at
processed_at
processing_state
~~~

Unique provider event identity prevents duplicate state transitions.

## 12. Reconciliation

Reconciliation compares local and provider states.

~~~mermaid
flowchart TD
LOCAL[Local Payment State] --> COMPARE[Reconciliation]
PROVIDER[Provider State] --> COMPARE
COMPARE --> MATCH[Consistent]
COMPARE --> MISSING[Missing Local Event]
COMPARE --> CONFLICT[Conflicting State]
MISSING --> REPAIR[Repair]
CONFLICT --> REVIEW[Manual Review]
~~~

Never delete historical events to hide a mismatch.

## 13. Pricing

Historical records retain pricing version.

~~~text
usage -> pricing_version
invoice -> calculation_policy_version
payment -> amount/currency at creation
~~~

Plan price changes do not rewrite past financial facts.

## 14. Subscription Suspension

Suspension is capability-specific.

Potential behavior:

| Capability | Suspended |
|---|---|
| historical reads | allowed |
| billing reads | allowed |
| new AI runs | denied |
| workflow starts | denied |
| new channel sends | policy-dependent |
| administration | policy-dependent |

## 15. Concurrency

Quota enforcement must protect:

~~~text
request A checks 9/10
request B checks 9/10
A consumes 1
B consumes 1
=> must not become 11/10 silently
~~~

Use atomic reservation, locking or equivalent strongly consistent mechanism.

## 16. Refund/Credit

Refunds/credits are distinct financial records:

~~~text
refund_id
payment_id
provider_reference
amount
currency
reason
actor/source
created_at
~~~

Never mutate the original payment amount to simulate a refund.

## 17. Failure Modes

| Failure | Behavior |
|---|---|
| invalid webhook | reject/no mutation |
| duplicate webhook | idempotent |
| provider/local mismatch | reconcile |
| unknown transaction | no automatic entitlement activation |
| quota race | reservation/constraint |
| pricing invalid | reject configuration |
| subscription suspended | capability policy |

## 18. Observability

Track:

- payment success/failure;
- webhook lag;
- pending payment age;
- reconciliation mismatch count;
- entitlement denials;
- usage ingestion lag;
- quota exhaustion;
- subscription transitions.

## 19. Tests

- duplicate payment event;
- delayed webhook;
- unknown status;
- amount mismatch;
- quota race;
- usage duplicate;
- plan change;
- suspension;
- refund;
- reconciliation.

## 20. Acceptance

Billing is complete when subscription, payment, entitlement and usage state are authoritative, idempotent, concurrency-safe and historically reproducible.
