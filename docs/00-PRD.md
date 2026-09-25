# PRD — OmniLinks (built on the Echo foundation)

## 1. Problem statement

Businesses talk to customers across WhatsApp, Instagram, Facebook, Telegram, SMS, and their website, but treat each channel as a separate inbox. This causes fragmented conversations, slow responses, repeated answers to the same FAQs, inconsistent answers between agents, and support cost that scales linearly with volume.

Echo already solves a narrower version of this problem for one channel (a website widget, plus voice via Vapi): unify conversations, ground AI answers in business documents, and hand off to a human when confidence is low. OmniLinks is that same architecture generalized across every channel a business actually uses, with unified customer identity, permissioned business actions, automation, and analytics layered on top.

## 2. Goals

- G1 — One customer, one conversation history, regardless of which channel they used, this time or last time.
- G2 — AI answers are grounded in the business's own documents (RAG), not the model's pretrained knowledge.
- G3 — AI can execute real business actions (not just answer), gated by explicit permissions and human approval where the action is high-risk.
- G4 — A human agent can take over any conversation, from any channel, with full context, at any time.
- G5 — The platform is multi-tenant with hard isolation between businesses (tenants).
- G6 — Operators can see resolution rate, escalation rate, and AI cost per conversation, per channel.
- G7 — Pricing scales with a business's actual usage and size (SMB / Mid-Market / Enterprise), not a single flat fee.

## 3. Non-goals (explicitly out of scope for v1)

- Full CRM or helpdesk replacement (ticketing depth, SLAs) — OmniLinks integrates with those, it doesn't replace them.
- Outbound marketing/broadcast campaigns — this PRD covers customer-initiated conversations and business-initiated transactional messages (order updates, appointment reminders), not bulk marketing sends.
- A no-code visual workflow builder — v1's automation engine is rule rows (trigger/condition/action), not a drag-and-drop canvas.
- Building a proprietary LLM — OmniLinks routes to existing providers (OpenAI, Anthropic, others), it doesn't train models.

## 4A. Operating model

OMNILINKS supports two commercial operating modes on the same platform.

### Direct operator mode

A business buys OMNILINKS and operates its own customer operations directly.

```
Business Tenant
  ├── Sectors
  ├── Teams
  ├── Human workforce
  └── AI workforce
```

### Service-provider mode

A BPO, contact-center, or managed-service company buys OMNILINKS to operate customer programs for multiple client businesses.

```
Service Provider Tenant
  ├── Client Accounts
  │    ├── Programs
  │    │    ├── Sectors
  │    │    └── Teams
  │    └── Client users
  └── Provider operations
```

The same tenant platform, identity model, workforce model, channel layer, AI layer, quality controls, analytics, and billing foundations support both modes.

OMNILINKS itself may also operate customer programs as a managed service. Platform administration and managed-service execution are separate concerns: platform staff do not automatically inherit customer-data access.

## 4B. Business hierarchy

The canonical business hierarchy is:

```
OMNILINKS Platform
        │
      Tenant
        │
   ┌────┴───────────────────────────────┐
   │                                    │
Direct operator                 Service provider
   │                                    │
   │                             Client Account
   │                                    │
   └───────────────┐              Program
                   │                 │
                 Sector            Sector
                   │                 │
                 Team              Team
                   │                 │
          Human / AI workforce members
```

Definitions:

- **Tenant** — the organization that contracts with OMNILINKS and owns an isolated data boundary.
- **Client Account** — a business served by a service-provider tenant.
- **Program** — an operational engagement for a client account, such as customer care for a telecom client.
- **Sector** — an operational discipline/workspace such as customer service, sales, collections, quality, workforce management, or back office.
- **Team** — an execution unit inside a sector/program.
- **Workforce member** — a human employee, contractor, or AI agent that can receive work according to policy and permissions.

A tenant can have many users and many sectors. Users may belong to multiple sectors and teams subject to explicit permissions.

## 4C. Product workspaces

OMNILINKS applications are organized around stable user workspaces, not around individual tenants.

The platform must support:

- **Tenant Administration** — organization, users, teams, permissions, channels, configuration, billing, and governance.
- **Platform Administration** — internal OMNILINKS operations, platform health, security, provider operations, and cross-tenant controls.
- **Sector Workspaces** — specialized applications for operational domains such as customer service, sales, quality, workforce, collections, and back office.
- **Customer Experience** — widget/embed and other customer-facing channel experiences.

Sector applications are shared products. A tenant receives access to the relevant sector applications based on its enabled sectors and each user's memberships/permissions.

## 4D. Workforce model

OMNILINKS treats AI as part of the operational workforce rather than only as a chat feature.

A workforce can contain:

- human agents
- supervisors
- quality staff
- workforce-management users
- AI agents

AI and human work must use the same operational concepts where practical: assignment, queue/routing, permissions, context, escalation, auditability, quality measurement, and performance analytics.

The platform must therefore support hybrid operations:

```
Customer
   ↓
AI workforce
   ↓
resolution OR escalation
   ↓
Human workforce
   ↓
Supervisor / Quality
```

## 4E. BPO substitution objective

OMNILINKS has two related value propositions:

1. **BPO enablement:** give BPO/service-provider companies the operating system required to run multi-client customer operations.
2. **BPO substitution:** allow businesses to run a materially larger portion of customer operations directly through OMNILINKS's AI-native workforce and automation, using human operators where required.

The product must not encode a requirement that every tenant is a BPO. Direct businesses and service providers share the same core platform.

## 4F. Business-model implications

The current subscription model must eventually support more than a binary active/inactive state. Commercial design must be capable of representing:

- tenant plan and entitlements
- usage-based consumption
- workforce scale
- channel costs
- AI/model costs
- optional managed-service operations
- client/program-level commercial reporting for service providers

Exact pricing remains a later commercial decision; the software must preserve these dimensions rather than hard-code a single pricing model.

## 4. Personas

- **End customer** — messages the business on whichever channel they already use; expects the business to "remember" them across channels.
- **Support agent** — works the unified inbox across all channels; needs full context (AI analysis, retrieved knowledge, actions already taken) before responding.
- **Business admin (tenant owner)** — configures channels, uploads knowledge base documents, sets automation rules, watches analytics, manages billing.
- **Platform operator (OmniLinks staff)** — monitors cross-tenant health, provider costs, and security incidents; never sees tenant customer data.

## 5. What Echo already gives us for free

Echo is not a mockup — it's a working implementation of the hardest part of this problem: a real-time AI chat engine (Convex Agents), RAG grounding (`@convex-dev/rag`), tool calling, and an escalate-or-resolve decision loop, plus multi-tenant auth (Clerk Organizations), billing scaffolding, and a plugin pattern (Vapi) that's the template for every future channel integration. The branch docs in this set map exactly which pieces to keep unchanged and which need extension.

## 6. Scope by phase

| Phase | Scope | Depends on Echo branches | New work |
|---|---|---|---|
| 1 — Foundation | Multi-tenant auth, dashboard, error tracking | 02–09 | Add `enabledChannels` field to org schema early (see branch 04) |
| 2 — Single-channel core | Web widget conversations, AI chat, escalate/resolve | 10–19 | Extend `contactSessions`/`conversations` schema for future multi-channel (branches 10, 13) |
| 3 — Knowledge & RAG | Document upload, embeddings, grounded search tool | 20–22 | None — keep as-is, just note the OpenAI-only embedding model as a future gateway target |
| 4 — Plugin pattern & voice | Vapi as first non-web channel, using Secrets Manager | 24–29 | None — this *is* the channel-adapter reference implementation |
| 5 — Ops surface | Contact panel, billing, integrations page, embed | 30–34 | Redesign 31 (tiers) and 33 (channel connect hub) |
| 6 — Omnichannel core | Channel adapters, unified identity | new 35–39 | WhatsApp, Instagram, Facebook, Telegram, SMS adapters + identity resolution |
| 7 — AI maturity | Multi-provider routing, permissioned actions | new 40–41 | AI Gateway, actions engine with approval gates |
| 8 — Operations | Automation, analytics, security, usage billing | new 42–45 | Rules engine, BI tables, audit log, metered pricing |

## 7. Success metrics

- AI resolution rate (conversations closed without escalation) ≥ target set per tenant.
- Median first-response time < target across all channels, not just web.
- Zero cross-tenant data leaks (hard requirement, not a target).
- AI cost per resolved conversation tracked and trending down as routing/caching improve.
- Customer identity merge accuracy — false-merge rate below an agreed threshold (see branch 39 for the confidence-scoring design).

## 8. Key risks

- **Channel API constraints are not optional** — WhatsApp's 24-hour customer-service window, Meta's messaging policies, and Telegram/SMS rate limits shape what "reply anytime, any channel" can actually promise. Each channel branch doc calls out its specific constraint.
- **Multi-provider routing adds latency** — start with one provider per tenant (what Echo already does) before building dynamic cost/latency routing (branch 40).
- **Pricing tiers aren't validated against real costs yet** — WhatsApp/Meta per-conversation fees, SMS costs, and LLM token spend all need to feed the tier design (branch 45) before it's finalized.
