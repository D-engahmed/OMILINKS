# SAD — Chapter 26: C4 Context Diagram

**Document:** Software Architecture Document
**Section:** C4 Context Diagram
**Version:** 0.1.0
**Status:** Draft — this is the proper Context-only split the SAD index.md already asked for ("chapters 03/04 should be split from the combined view, not duplicate it")

---

## Purpose

Pure Context level: people and external systems, no containers, no internal structure. The existing SAD `index.md` combines Context and Container in one diagram — that combined view stays as the at-a-glance index diagram; this chapter is the dedicated, containers-stripped-out version.

---

## C4 Context Diagram

```mermaid
C4Context
  title System Context — Omnilinks

  Person(tenantUser, "Tenant User", "Team Admin / Manager / Supervisor / Agent / Analyst (ch.14)")
  Person(platformUser, "Platform User", "Omnilinks staff, cross-tenant, audited (ch.13)")
  Person(customer, "Customer / Contact", "End user, never authenticates (ch.13)")

  System(omnilinks, "Omnilinks", "Multi-tenant AI-powered omnichannel customer engagement platform")

  System_Ext(channels, "Channel Platforms", "WhatsApp, Telegram, Instagram, Facebook Messenger, SMS, VoIP")
  System_Ext(llmProviders, "LLM Providers", "OpenAI, Anthropic, Gemini, local open-weight (BRD ch.01 multi-LLM router)")
  System_Ext(paymob, "Paymob", "Payment gateway — Egypt/UAE/Saudi confirmed; Qatar/Morocco TBD (BRD ch.01)")

  Rel(customer, channels, "Sends/receives messages")
  Rel(channels, omnilinks, "Webhooks")
  Rel(tenantUser, omnilinks, "Configures, monitors, handles escalations")
  Rel(platformUser, omnilinks, "Operates infrastructure, provisions tenants")
  Rel(omnilinks, llmProviders, "Generates AI replies")
  Rel(omnilinks, paymob, "Tokenized charges")
```

---

## What Moved Out (Now Container-Level, ch.27)

| Removed from this view | Now lives in |
|---|---|
| Next.js Frontend, FastAPI Backend | ch.27 (C4 Container) |
| PostgreSQL, Redis, Qdrant | ch.27 (C4 Container) |
| Individual domain services (Auth, AI, RAG, Billing, etc.) | ch.28 (C4 Component) |

---

> **Next:** [Chapter 27 — C4 Container Diagram](27-c4-container.md)
