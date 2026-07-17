# SAD — Chapter 21: Business Process (BPMN)

**Document:** Software Architecture Document
**Section:** End-to-End Business Process
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

A BPMN-style pool/lane view of the full support process across organizational boundaries (Contact, Tenant org, Omnilinks platform) — complementary to ch.18's technical message journey, at the business-process level instead of the system level. Mermaid has no native BPMN renderer, so this uses swimlane `flowchart` conventions consistent with the style already established in `tenant_cstomer_jurny.md`.

---

## End-to-End Process

```mermaid
flowchart TB
    subgraph PoolContact["Pool: Contact"]
        C1(["Start: has an issue/question"])
        C2["Sends message via preferred channel"]
        C3(["End: issue resolved"])
    end

    subgraph PoolOmnilinks["Pool: Omnilinks Platform"]
        subgraph LaneAI["Lane: AI Decision Engine"]
            A1["Classify + attempt resolution (ch.19)"]
            A2{"Resolved?"}
        end
        subgraph LaneOps["Lane: Tenant Operations (ch.13/14)"]
            O1["Human Agent handles escalation"]
            O2["Supervisor approves exceptions"]
            O3["Manager rebalances load if needed"]
            D1{"Agent resolves?"}
        end
        subgraph LaneBilling["Lane: Billing & Analytics"]
            B1["Meter AI Credit / usage (BRD ch.09)"]
            B2["Emit BI event (BRD ch.01)"]
        end

    end

    subgraph PoolTenantOrg["Pool: Tenant Organization"]
        T1["Team Admin/Tenant Admin:<br/>review analytics, adjust config"]
    end

    C1 --> C2 --> A1
    A1 --> A2
    A2 -->|"yes, confidence>=80%"| B1
    A2 -->|"no"| O1
    O1 --> D1{"Agent resolves?"}
    D1 -->|"yes"| B1
    D1 -->|"needs exception"| O2 --> B1
    O2 -.->|"structural issue"| O3 --> T1
    B1 --> B2 --> C3
```

---

## Process Ownership Table

| Sub-process | Owner | Cross-reference |
|---|---|---|
| Message intake & classification | AI Decision Engine | ch.19 |
| Escalation & exception handling | Human Agent → Supervisor → Manager | ch.20, ch.14 |
| Usage metering | Billing Domain | BRD ch.09, SAD index.md domain structure |
| Analytics emission | Analytics Domain | BRD ch.01 (post-launch/ongoing) |
| Config/strategy feedback loop | Team Admin / Tenant Admin | ch.13, ch.16 |

---

## Note on BPMN Fidelity

This diagram uses swimlanes to approximate BPMN pools/lanes since Mermaid does not support native BPMN notation (no gateways-as-diamonds-with-BPMN-semantics, no proper message-flow dashed lines between pools). If a truly BPMN-compliant diagram is required for external stakeholder or compliance documentation, it should be produced in a dedicated BPMN tool (e.g., Camunda Modeler, bpmn.io) using this chapter's process boundaries as the source of truth — not attempted a second way in Mermaid.

---

> **Next:** [Chapter 22 — Use Case Diagram](22-use-case-diagram.md)
