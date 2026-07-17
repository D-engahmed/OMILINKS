# SAD — Chapter 20: Human Escalation Flow

**Document:** Software Architecture Document
**Section:** Human Escalation Flow
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

Ch.19 defines *when* AI decides a human is needed. This chapter defines what happens *after* that decision — routing, SLA, and role responsibilities, using the roles reconciled in ch.14.

---

## Escalation Paths

```mermaid
flowchart TB
    Trigger{"Escalation trigger"} -->|"Confidence < 40%"| Handoff["Direct human handoff"]
    Trigger -->|"Confidence 40-80%"| Review["Human review queue<br/>(AI draft attached)"]
    Trigger -->|"Guardrail failure"| Handoff
    Trigger -->|"Policy: not authorized to auto-send"| Review
    Trigger -->|"Customer explicitly asks for a human"| Handoff

    Handoff --> Assign["Assign to available Human Agent<br/>in the relevant team"]
    Review --> AgentReview["Human Agent reviews AI draft"]
    
    AgentReview --> D1{"Decision"}
    D1 -->|"Approve as-is"| Send["Send (counts as AI-assisted,<br/>not pure auto-resolution — BRD OBJ-05 note"]
    D1 -->|"Edit"| SendEdited["Send edited reply"]
    D1 -->|"Reject"| Escalate["Escalate further to Supervisor"]

    Assign --> AgentHandles["Agent handles conversation directly"]
    AgentHandles --> D2{"Agent can resolve?"}
    D2 -->|"no — needs authority Agent lacks"| ToSupervisor["Escalate to Supervisor"]
    D2 -->|"yes"| Close["Close conversation"]

    Escalate --> ToSupervisor
    ToSupervisor --> SupDecision{"Supervisor decision"}
    SupDecision -->|"Approve exception<br/>(e.g. refund over threshold)"| Close
    SupDecision -->|"Needs Manager/Team Admin"| ToManager["Escalate to Manager or Team Admin"]
```

---

## SLA Timer (Interruptible Region)

```mermaid
flowchart LR
    S1["Conversation escalated"] -.->|"SLA timer starts"| Timer["First-response SLA<br/>(BRD ch.03: escalation window,<br/>not the retired <30s target)"]
    Timer -.->|"breach"| Alert["Alert Supervisor +<br/>reassign or reprioritize"]
    Timer -.->|"met"| Normal["Normal flow continues"]
```

> The SLA figure itself is intentionally not restated as a number here — BRD ch.03 already flagged the original "<30 seconds" human-response target as unrealistic and left the real figure open pending a defined support-staffing model. This diagram shows the *mechanism* (timer + breach alert), not a number that isn't decided yet.

---

## Role Responsibility at Each Stage

| Stage | Responsible Role (ch.14) |
|---|---|
| Receive assigned/escalated conversation | Human Agent |
| Approve/reject AI draft in review queue | Human Agent (first pass), Supervisor (on reject) |
| Approve policy exceptions (e.g., over-threshold refund) | Supervisor |
| Cross-team load rebalancing during an SLA breach spike | Manager |
| Structural fix (e.g., team is chronically understaffed) | Team Admin / Tenant Admin |

---

## Open Items Carried Forward

1. The real escalation-SLA number (replacing the retired <30s target) still depends on a support-staffing model not yet defined (BRD ch.03/06 open item) — this chapter's timer mechanism is ready regardless of what the number ends up being.
2. Whether an approved-as-is AI draft counts toward BRD OBJ-05's Auto-Resolution rate is worth an explicit decision — arguably it shouldn't, since a human still reviewed it. Flagging for ch.06 (BRD) reconciliation, not resolved here.

---

> **Next:** [Chapter 21 — Business Process (BPMN)](21-business-process-bpmn.md)
