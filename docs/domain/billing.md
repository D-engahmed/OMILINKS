# Billing Domain

> Status: **Target production domain contract**

Billing is a financial control plane for OMILINKS. It determines subscription state, entitlements, usage, payment lifecycle and reconciliation.

Billing must be independent of UI assumptions and must not depend on browser redirects as financial truth.

## 1. Core Model

~~~mermaid
erDiagram
ORGANIZATION ||--o{ SUBSCRIPTION : has
PLAN ||--o{ ENTITLEMENT : grants
SUBSCRIPTION }o--|| PLAN : uses
ORGANIZATION ||--o{ USAGE_RECORD : produces
SUBSCRIPTION ||--o{ PAYMENT : receives
PAYMENT ||--o{ PAYMENT_WEBHOOK : reconciles
ORGANIZATION ||--o{ INVOICE : owns
~~~

## 2. Main Entities

| Entity | Purpose |
|---|---|
| Plan | commercial offering |
| Entitlement | allowed capability/limit |
| Subscription | organization's current commercial state |
| UsageMeter | measurement definition |
| UsageRecord | immutable usage fact |
| Invoice | billed amount/period |
| Payment | payment lifecycle |
| PaymentWebhook | provider event/reconciliation record |

## 3. Subscription Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> TRIALING
    TRIALING --> ACTIVE
    ACTIVE --> PAST_DUE
    PAST_DUE --> ACTIVE
    PAST_DUE --> SUSPENDED
    ACTIVE --> CANCELED
    TRIALING --> CANCELED
    SUSPENDED --> ACTIVE
    SUSPENDED --> CANCELED
~~~

The exact transition rules must be explicit and event-driven.

## 4. Plan and Entitlement

A Plan is commercial configuration.

Entitlements are machine-enforceable capabilities.

Examples:

~~~text
users.max
sites.max
customers.max
conversations.month
ai.tokens.month
workflow_runs.month
storage.gb
channels.max
~~~

Do not encode limits directly in UI code.

## 5. Entitlement Evaluation

A backend request checks:

~~~text
organization
 -> active subscription
 -> plan
 -> entitlement
 -> current usage
 -> requested operation
 -> allow / deny
~~~

~~~mermaid
flowchart TD
REQ[Governed Operation] --> SUB[Subscription State]
SUB --> PLAN[Plan]
PLAN --> ENT[Entitlement]
ENT --> USAGE[Current Usage]
USAGE --> LIMIT{Within Limit?}
LIMIT -->|yes| ALLOW[Allow]
LIMIT -->|no| DENY[Deny / Upgrade / Queue]
~~~

The frontend may display the result but never determines it.

## 6. Usage Metering

Usage records should be append-oriented.

Example dimensions:

- organization;
- client/program;
- feature;
- agent;
- conversation;
- run;
- provider;
- model;
- quantity;
- unit;
- timestamp;
- pricing version.

Usage should be attributable to the operation that produced it.

## 7. Usage Lifecycle

~~~mermaid
sequenceDiagram
participant APP as Application
participant M as Metering
participant DB as Billing DB
participant ENT as Entitlement
APP->>M: Operation completed
M->>DB: Record usage fact
DB-->>M: Stored
M->>ENT: Refresh effective usage
ENT-->>APP: Future authorization uses updated state
~~~

For expensive operations, preflight estimation can happen before execution, but final usage comes from actual runtime/provider facts.

## 8. Idempotent Metering

Metering can be duplicated by retries.

Use a semantic usage event ID:

~~~text
usage_event_id
= source_event_id + meter_version
~~~

or another deterministic key appropriate to the operation.

A retry must not count the same usage twice.

## 9. Payment Lifecycle

Payment state comes from verified server-side provider interaction.

~~~mermaid
sequenceDiagram
participant U as User
participant API as OMILINKS API
participant PM as Paymob
participant WH as Webhook Receiver
participant BILL as Billing
U->>API: Start checkout
API->>PM: Create payment session
PM-->>U: Provider checkout
U->>PM: Pay
PM->>WH: Verified payment event
WH->>BILL: Reconcile transaction
BILL->>BILL: Update payment
BILL->>BILL: Update subscription
BILL-->>API: Entitlements refreshed
~~~

A browser redirect is not sufficient proof of payment.

## 10. Webhook Reconciliation

Every payment webhook stores:

- provider event ID;
- provider transaction ID;
- signature verification result;
- received timestamp;
- payload reference;
- processing state;
- associated payment;
- processing outcome.

Duplicate events must be harmless.

## 11. Reconciliation

Financial state can diverge because:

- webhook delivery failed;
- payment provider retried;
- browser was closed;
- database transaction failed;
- provider state advanced while OMILINKS was unavailable.

Provide a reconciliation operation:

~~~text
OMILINKS payment
      vs
provider payment
      |
      v
match / missing / conflicting
      |
      v
repair workflow
~~~

Never "repair" by deleting historical payment facts.

## 12. Subscription Suspension

Suspension must define capabilities independently.

Example:

| Capability | Suspended behavior |
|---|---|
| login | allowed |
| historical read | allowed |
| new AI runs | blocked |
| new workflow executions | blocked |
| outbound automation | policy-dependent |
| billing access | allowed |
| export | policy-dependent |

This is preferable to a single global boolean that breaks every operation.

## 13. Proration and Plan Changes

If plan changes alter billing period or quotas, store the effective time.

Do not retroactively reinterpret historical usage under the new plan.

Historical usage references the entitlement/pricing context used when measured.

## 14. Pricing Versioning

Provider prices and OMILINKS commercial terms may change.

Persist:

- price version;
- currency;
- effective_from;
- effective_to where applicable;
- unit prices;
- calculation policy.

Historical invoices/usage must remain reproducible.

## 15. Billing Concurrency

Two simultaneous requests can both observe available quota.

For hard limits, enforcement must use a concurrency-safe mechanism:

- transaction/lock;
- atomic counter;
- reservation;
- database constraint;
- or equivalent strongly consistent mechanism.

Soft warnings can remain eventually consistent.

## 16. Cross-Domain Contracts

**Tenancy:** organization owns billing.

**AI:** AI usage consumes entitlements and generates usage records.

**Tools:** governed actions can be entitlement checked.

**Workflows:** execution can consume workflow/run limits.

**Integrations:** Paymob provides payment events; OMILINKS remains billing source of truth after verified reconciliation.

**Analytics:** usage facts feed financial/operational reporting.

## 17. Failure Modes

| Failure | Behavior |
|---|---|
| payment webhook invalid | reject/no mutation |
| payment webhook duplicate | return existing processing outcome |
| provider says paid, local says unpaid | reconcile |
| entitlement unavailable | fail closed for expensive/high-risk action |
| usage duplicate | idempotent dedupe |
| concurrent quota check | strongly consistent reservation/constraint |
| subscription suspended | apply capability-specific suspension |
| pricing config invalid | reject publication/change |

## 18. Observability

Track:

- payment success/failure;
- webhook lag;
- reconciliation mismatch count;
- entitlement denials;
- usage rate;
- quota exhaustion;
- subscription state distribution;
- invoice failures;
- provider errors.

Financial alerts should have stronger severity handling than ordinary UX errors.

## 19. Audit

Audit:

- plan changes;
- entitlement changes;
- subscription transitions;
- payment reconciliation;
- invoice adjustments;
- manual billing overrides;
- refunds/credits where supported.

Never erase original financial facts to make the current state look correct.

## 20. Acceptance Criteria

- Backend entitlement checks are authoritative.
- Duplicate payment events do not duplicate financial state.
- Usage is attributable and idempotent.
- Historical billing remains reproducible.
- Quota enforcement is concurrency-safe.
- Subscription suspension is capability-specific.
- Payment state is not derived from browser redirect alone.
