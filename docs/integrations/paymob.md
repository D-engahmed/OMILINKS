# Paymob Integration — Implementation Specification

> Status: **Target payment-provider blueprint**

## 1. Boundary

PaymobAdapter owns provider-specific payment/session/event semantics.

Billing owns canonical subscription and entitlement state.

## 2. Trust Model

~~~text
Browser checkout
    !=
payment authority
~~~

Authoritative payment state comes from verified provider events plus reconciliation.

## 3. Payment Data

Store:

~~~text
organization_id
payment_id
invoice/payment intent
provider_transaction_id
amount
currency
canonical_status
provider_status
verification_state
reconciliation_state
created_at
updated_at
~~~

Historical amount/currency is immutable.

## 4. Checkout Flow

~~~mermaid
sequenceDiagram
participant U as Browser
participant API as OMILINKS API
participant P as Paymob
participant W as Webhook
participant B as Billing
U->>API: Start checkout
API->>P: Create payment
P-->>U: Checkout session
U->>P: Payment
P->>W: Provider event
W->>B: Verify + reconcile
B->>B: Update payment
B->>B: Transition subscription
~~~

## 5. Webhook Verification

Verify provider authentication/signature before payment mutation.

Invalid events create no financial state.

## 6. Idempotency

Use provider event/transaction identifiers with internal payment context.

Duplicate events must not:

- activate twice;
- extend twice;
- credit twice;
- create duplicate financial records.

## 7. Reconciliation

~~~mermaid
flowchart TD
LOCAL[Local Payment] --> COMPARE[Compare]
PROVIDER[Provider Payment] --> COMPARE
COMPARE --> MATCH[Match]
COMPARE --> MISSING[Missing Event]
COMPARE --> CONFLICT[Conflict]
MISSING --> REPAIR[Repair]
CONFLICT --> REVIEW[Manual Review]
~~~

Never delete historical financial facts.

## 8. Subscription Coupling

Verified payment -> billing application service -> subscription transition -> entitlement refresh.

Do not manipulate feature flags directly in provider adapter code.

## 9. Concurrency

Concurrent webhook processing is protected by unique provider event/transaction keys.

Subscription transition re-checks current state before mutation.

## 10. Unknown Outcome

Payment API timeout does not imply failure.

Enter pending/unknown state and reconcile before creating another payment effect.

## 11. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid webhook | reject/no mutation |
| duplicate webhook | idempotent |
| amount mismatch | quarantine |
| unknown transaction | no entitlement activation |
| provider outage | preserve pending |
| local transaction conflict | reconcile/retry |

## 12. Tests

- success;
- failure;
- duplicate event;
- delayed event;
- amount mismatch;
- timeout;
- subscription activation;
- suspension;
- refund/credit;
- reconciliation.

## 13. Observability

Track checkout failures, webhook lag, pending age, payment transitions, reconciliation mismatches and entitlement propagation latency.

## 14. Acceptance

Payment integration is complete only when provider authentication, financial idempotency, reconciliation and authoritative subscription transition are proven.
