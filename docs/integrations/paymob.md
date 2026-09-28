# Paymob Integration

> Status: **Target production payment integration contract**

## 1. Purpose

Paymob is the external payment boundary for OMILINKS checkout and payment confirmation.

OMILINKS remains authoritative for its internal subscription, entitlement and billing lifecycle after verified provider reconciliation.

## 2. Financial Trust Boundary

The browser may start checkout and display a payment result, but it is not authoritative financial evidence.

Authoritative path:

~~~text
checkout request
 -> provider payment
 -> verified provider event
 -> payment reconciliation
 -> subscription transition
 -> entitlement refresh
~~~

## 3. Payment Records

Persist:

- organization;
- internal payment ID;
- invoice/payment intent;
- provider transaction ID;
- amount;
- currency;
- canonical payment state;
- provider event identifiers;
- verification status;
- reconciliation state;
- timestamps.

Historical financial facts are immutable.

## 4. Payment State Machine

~~~mermaid
stateDiagram-v2
    [*] --> INITIATED
    INITIATED --> PENDING
    PENDING --> PAID
    PENDING --> FAILED
    PENDING --> EXPIRED
    PAID --> REFUNDED
    PAID --> DISPUTED
~~~

Provider-specific statuses are mapped to canonical states without losing provider status metadata.

## 5. Checkout Flow

~~~mermaid
sequenceDiagram
    participant U as Browser
    participant API as OMILINKS API
    participant P as Paymob
    participant W as Webhook
    participant B as Billing
    U->>API: Start checkout
    API->>P: Create payment session
    P-->>U: Checkout
    U->>P: Complete payment
    P->>W: Provider event
    W->>B: Verified event
    B->>B: Reconcile transaction
    B->>B: Update payment
    B->>B: Update subscription
    B-->>API: Entitlements current
~~~

The redirect path improves UX but does not establish authoritative payment truth.

## 6. Webhook Security

Provider authentication/signature verification occurs before payment mutation.

Invalid payment callbacks create no financial state.

## 7. Idempotency

Use provider transaction/event identifiers plus internal organization/payment context.

Duplicate events must not:

- create duplicate payment records;
- activate a subscription twice;
- extend a period twice;
- apply credits twice.

## 8. Reconciliation

Reconciliation handles:

- delayed/missing webhook;
- local DB failure;
- provider state advancing during outage;
- duplicate webhook;
- unknown transaction status.

~~~mermaid
flowchart LR
LOCAL[Local Payment] --> COMPARE[Compare]
PROVIDER[Provider State] --> COMPARE
COMPARE --> MATCH[Match]
COMPARE --> MISSING[Missing Local Event]
COMPARE --> CONFLICT[Conflict]
MISSING --> REPAIR[Repair]
CONFLICT --> REVIEW[Manual Review]
~~~

Repair adds/corrects state through auditable operations; it does not erase historical facts.

## 9. Amount Integrity

The payment amount/currency expected at creation is retained.

Do not re-read current plan price and overwrite historical payment data.

Plan changes have effective timestamps and do not retroactively change old payments.

## 10. Subscription Coupling

A verified payment can trigger the Billing domain transition.

Payment adapters must not directly manipulate product feature flags.

Entitlements are derived from subscription/plan policy.

## 11. Refunds and Credits

Refund/credit operations are explicit financial records with:

- provider/internal ID;
- amount;
- reason;
- actor/source;
- timestamp;
- original payment reference;
- reconciliation state.

## 12. Failure Matrix

| Failure | Behavior |
|---|---|
| invalid webhook | reject/no mutation |
| duplicate webhook | idempotent |
| timeout | reconcile before retry |
| amount mismatch | quarantine/manual review |
| unknown transaction | do not activate entitlement automatically |
| provider outage | preserve pending state |
| local update conflict | reconcile, do not overwrite history |

## 13. Security

- credentials server-side;
- billing actions require billing permissions;
- logs contain no payment secrets;
- browser state cannot activate entitlements;
- sensitive payment information is minimized.

## 14. Observability

Track:

- checkout failure rate;
- webhook verification failures;
- webhook lag;
- pending-payment age;
- payment state transitions;
- reconciliation mismatches;
- entitlement propagation latency.

## 15. Testing

- successful payment;
- failed payment;
- duplicate webhook;
- delayed webhook;
- provider timeout;
- amount mismatch;
- subscription activation;
- suspension;
- refund/credit;
- reconciliation.

## 16. Acceptance Criteria

- Browser redirects are never payment authority.
- Duplicate payment events are harmless.
- Historical transaction data is immutable.
- Subscription transitions are auditable.
- Entitlements derive from verified billing state.
- Provider/local mismatches create explicit reconciliation work.
