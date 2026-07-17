# SAD — Chapter 23: Sequence Diagrams

**Document:** Software Architecture Document
**Section:** Sequence Diagrams for Key Scenarios
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

Step-by-step interaction diagrams for scenarios not already covered. The AI-auto-reply happy path is already fully diagrammed in ch.01-architecture-overview.md ("Request Flow — Concrete Example") — not repeated here. This chapter covers three scenarios that aren't shown anywhere else yet: **human escalation**, **tenant provisioning**, and **a billing charge**.

---

## Scenario 1: Human Escalation Path

```mermaid
sequenceDiagram
    participant C as Customer (Contact)
    participant AI as AI Domain
    participant CV as Conversation Domain
    participant SUP as Supervisor (dashboard)
    participant AG as Human Agent (dashboard)
    participant PG as PostgreSQL (RLS-scoped)

    AI->>CV: Confidence < 40%, escalate
    CV->>PG: Set conversation.status = escalated
    CV->>AG: Push notification (assigned)
    AG->>CV: Open conversation
    CV->>AG: Load context (history, RAG hits, AI attempt)
    AG->>CV: Compose reply
    alt Agent can resolve
        CV->>C: Deliver reply via channel adapter
        CV->>PG: status = closed
    else Needs Supervisor approval (e.g. refund over threshold)
        AG->>SUP: Escalate further
        SUP->>CV: Approve exception
        CV->>C: Deliver reply
        CV->>PG: status = closed, exception_approved_by = SUP
    end
```

---

## Scenario 2: New Tenant Provisioning

```mermaid
sequenceDiagram
    participant U as Prospective Tenant Admin
    participant API as FastAPI (Tenant Domain)
    participant AUTH as Auth Domain
    participant PG as PostgreSQL
    participant BILL as Billing Domain
    participant PAY as Paymob

    U->>API: Sign up + select TenantType (ch.13 §2)
    API->>AUTH: Create User + hash credentials
    AUTH->>PG: Insert user
    API->>PG: Insert tenant, default team "General" (ch.13 rule S1)
    API->>PG: Assign U as Tenant Admin + Team Admin
    API->>BILL: Start 14-day trial (BRD ch.09)
    BILL->>PAY: Tokenize payment method (deferred until trial end)
    API-->>U: Onboarding complete, redirect to channel setup
```

---

## Scenario 3: Usage-Based Billing Charge

```mermaid
sequenceDiagram
    participant BILL as Billing Domain
    participant PG as PostgreSQL
    participant PAY as Paymob
    participant AN as Analytics Domain
    participant TA as Tenant Admin (notification)

    Note over BILL: Monthly cycle close, or overage threshold hit
    BILL->>PG: Aggregate usage (AI Credits, messages, seats)
    BILL->>PG: Compare against plan allocation (BRD ch.09)
    alt Within allocation
        BILL->>PAY: Charge base subscription (tokenized, merchant-initiated)
    else Overage
        BILL->>PG: Calculate overage charge (BRD ch.09 rates)
        BILL->>PAY: Charge base + overage
    end
    PAY-->>BILL: Charge result
    alt Charge failed
        BILL->>TA: Notify payment failure (ties to ch.08 R-06)
    else Charge succeeded
        BILL->>AN: Emit revenue event
    end
```

---

## Cross-Reference

| Scenario | Complements |
|---|---|
| Human Escalation | ch.20 (flow-level), this chapter (call-level) |
| Tenant Provisioning | ch.13 (structural rules), BRD ch.01 (onboarding flow) |
| Billing Charge | BRD ch.09 (rates), ch.08 R-06/R-13 (payment provider risk) |

---

> **Next:** [Chapter 24 — Domain Model](24-domain-model.md)
