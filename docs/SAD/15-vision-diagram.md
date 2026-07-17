# SAD — Chapter 15: Vision Diagram

**Document:** Software Architecture Document
**Section:** Vision Diagram
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

One diagram that answers "what is Omnilinks, and who uses it" without any implementation detail — the entry point for a new stakeholder reading the SAD for the first time. Everything here is already established elsewhere (BRD ch.01/03, SAD ch.13); this chapter's job is to compress it into a single picture, not introduce anything new.

---

## Vision Diagram

```mermaid
flowchart TB
    subgraph World["The Problem (BRD ch.03)"]
        P1["Channel fragmentation"]
        P2["Manual routing"]
        P3["No unified analytics"]
        P4["No AI leverage"]
        P5["Disconnected billing"]
    end

    subgraph Omnilinks["Omnilinks Platform"]
        direction TB
        Core["Multi-tenant AI Operating System<br/>for customer engagement"]
        F1["Unified Inbox — 6 channels"]
        F2["Multi-LLM AI Decision Engine"]
        F3["RAG Knowledge Base"]
        F4["Usage-metered Billing"]
        F5["Real-time BI Analytics"]
        Core --- F1 & F2 & F3 & F4 & F5
    end

    subgraph Planes["Three Planes (ch.13)"]
        direction LR
        Platform["Platform Plane<br/><small>Omnilinks staff — operate infra</small>"]
        Tenant["Tenant Plane<br/><small>Team Admin, Manager, Supervisor,<br/>Human Agent, Analyst</small>"]
        Customer["Customer Plane<br/><small>Contacts — never log in,<br/>message only</small>"]
    end

    World -->|"Omnilinks resolves"| Omnilinks
    Platform -->|"operates"| Omnilinks
    Tenant -->|"configures & works within"| Omnilinks
    Customer -->|"messages into"| Omnilinks
```

---

## What This Diagram Deliberately Leaves Out

| Excluded | Where it actually lives |
|---|---|
| Channel adapter detail, provider abstractions | ch.26 (C4 Container), ch.27 (C4 Component) |
| Role permission detail | ch.13, ch.14 |
| AI decision internals | ch.19 (AI Decision Flow), ch.29 (AI Architecture) |
| Pricing / tenant type detail | BRD ch.09, SAD ch.13 §2 |
| Infrastructure / deployment | ch.30 (Deployment) |

This chapter is intentionally shallow — a vision diagram that tries to show everything stops being a vision diagram.

---

> **Next:** [Chapter 16 — Stakeholder Map](16-stakeholder-map.md)
