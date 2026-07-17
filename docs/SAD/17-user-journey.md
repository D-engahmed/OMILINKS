# SAD — Chapter 17: User Journey

**Document:** Software Architecture Document
**Section:** User Journey (per actor)
**Version:** 0.1.0
**Status:** Draft

---

## Purpose

How each actor type (ch.16) actually experiences the platform over time — distinct from the Customer Message Journey (ch.18), which is a single-message technical flow. This chapter is journey-per-actor across their whole relationship with the platform, not one conversation.

---

## Tenant Admin Journey

```mermaid
journey
    title Tenant Admin — Onboarding to Steady State
    section Provisioning (BRD ch.01 flow)
      Sign up, select tenant type: 5: Tenant Admin
      Confirm plan (Trial/SMB/Mid/Enterprise): 4: Tenant Admin
      Default team auto-created: 5: Tenant Admin
    section Configuration
      Connect channels: 3: Tenant Admin
      Configure AI + upload KB docs: 3: Tenant Admin
      Invite first Team Admins: 4: Tenant Admin
      Set up billing: 3: Tenant Admin
    section Steady State
      Review tenant-wide analytics: 5: Tenant Admin
      Manage escalation policy: 4: Tenant Admin
      Handle plan upgrades: 4: Tenant Admin
```

## Team Admin Journey

```mermaid
journey
    title Team Admin — Team Lifecycle
    section Setup
      Create new team (e.g. Arabic Support): 5: Team Admin
      Configure team's AI + channels: 4: Team Admin
      Invite/assign users to team: 4: Team Admin
    section Operate
      Adjust permission templates: 3: Team Admin
      Review team-level KPIs: 4: Team Admin
    section Change
      Reconfigure integrations: 3: Team Admin
      Retire team (if not the tenant's last one, ch.13 S1): 2: Team Admin
```

## Human Agent Journey

```mermaid
journey
    title Human Agent — Daily Workflow
    section Shift Start
      Log into dashboard: 5: Agent
      Review assigned queue: 4: Agent
    section Handling
      Receive AI-escalated conversation: 3: Agent
      Use AI suggestion / KB search: 4: Agent
      Reply or escalate further: 4: Agent
      Create/update ticket: 3: Agent
    section Shift End
      Close resolved conversations: 5: Agent
```

## Contact (Tenant's Customer) Journey

```mermaid
journey
    title Contact — Message to Resolution
    section Reach Out
      Send WhatsApp/IG/Telegram message: 5: Contact
    section Wait
      Receive AI first response (<5s, BRD OBJ-07): 4: Contact
    section Resolution
      Get resolved by AI (target 45-65%, BRD OBJ-05): 5: Contact
      Or get escalated to human agent: 3: Contact
    section Follow-up
      Receive NPS/CSAT survey (BRD ch.06): 3: Contact
```

---

## Cross-Journey Note

Every journey above terminates or escalates into the technical flow already fully detailed in `tenant_cstomer_jurny.md` (60+ steps, ingestion → AI orchestration → delivery) — this chapter stays at the human-experience level; ch.18 is the system-level version of the Contact journey specifically.

---

> **Next:** [Chapter 18 — Customer Message Journey](18-customer-message-journey.md)
