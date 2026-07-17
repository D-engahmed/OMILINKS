# SAD — Chapter 22: Use Case Diagram

**Document:** Software Architecture Document
**Section:** Use Case Diagram
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

Functional capabilities per actor, at the use-case level — narrower than ch.16's stakeholder map, broader than any single sequence diagram (ch.23). Mermaid has no native UML use-case notation, so this is expressed as a `flowchart` with actor nodes connected to capability nodes, grouped by domain — a widely accepted Mermaid substitute for use-case diagrams.

---

## Tenant-Side Use Cases

```mermaid
flowchart LR
    TAdmin(["Tenant Admin"])
    TeamAdmin(["Team Admin"])
    Manager(["Manager"])
    Supervisor(["Supervisor"])
    Agent(["Human Agent"])
    Analyst(["Analyst"])

    UC1["Configure tenant-wide billing"]
    UC2["Manage integrations"]
    UC3["Create / delete team"]
    UC4["Configure team AI + channels"]
    UC5["Invite user to team"]
    UC6["Assign conversations across teams"]
    UC7["Move users between teams"]
    UC8["Monitor live queue"]
    UC9["Approve AI draft / escalation"]
    UC10["Reply to customer"]
    UC11["Search knowledge base"]
    UC12["Create / update ticket"]
    UC13["View dashboards"]
    UC14["Export reports"]

    TAdmin --> UC1 & UC2
    TeamAdmin --> UC3 & UC4 & UC5
    Manager --> UC6 & UC7
    Supervisor --> UC8 & UC9
    Agent --> UC10 & UC11 & UC12
    Analyst --> UC13 & UC14
```

## Customer & Platform Use Cases

```mermaid
flowchart LR
    Contact(["Contact"])
    SysOp(["System Operator"])
    PlatAdmin(["Platform Admin"])

    UC15["Send message via channel"]
    UC16["Receive AI or human reply"]
    UC17["Provide NPS/CSAT feedback"]

    UC18["Monitor infrastructure health"]
    UC19["Restart service / clear queue"]
    UC20["View cross-tenant logs (audited)"]

    UC21["Provision new tenant"]
    UC22["Override billing/plan"]
    UC23["Suspend tenant (policy violation)"]

    Contact --> UC15 & UC16 & UC17
    SysOp --> UC18 & UC19 & UC20
    PlatAdmin --> UC21 & UC22 & UC23
```

---

## Use Case ↔ Permission Cross-Reference

| Use Case | Requires Permission (ch.14) |
|---|---|
| UC3 Create/delete team | `team.*` (Team Admin only) |
| UC6 Assign conversations across teams | `operations.*` (Manager) |
| UC9 Approve AI draft | `ai_response.approve` (Supervisor) |
| UC10 Reply to customer | `conversation.reply` (Human Agent) |
| UC14 Export reports | `analytics.read` + `report.export` (Analyst) |
| UC20 View cross-tenant logs | Platform-plane only — never available to any tenant-plane role (ch.13 rule S6) |

---

> **Next:** [Chapter 23 — Sequence Diagrams](23-sequence-diagrams.md)
