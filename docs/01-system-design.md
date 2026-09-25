# System Design — OmniLinks on Echo (High-Level)

## 1. Current state (Echo, branch 34 / main)

```
CUSTOMER (browser only)
    │
    ▼
apps/embed (Vite widget.js loader)
    │
    ▼
apps/widget (Next.js — screens, session, chat UI)
    │
    ▼
packages/backend/convex
    ├── public/*        (client-callable: contactSessions, conversations, messages, secrets, widgetSettings)
    ├── private/*        (dashboard-only, Clerk-authenticated: conversations, messages, files, plugins, vapi)
    ├── system/*         (internal — agent/tool/cron only, never client-callable)
    │   └── ai/
    │       ├── agents/supportAgent.ts   — one Convex Agent, hardcoded openai("gpt-4o-mini")
    │       ├── rag.ts                    — one RAG instance, namespace = organizationId
    │       └── tools/                    — search, escalateConversation, resolveConversation
    └── schema.ts        (subscriptions, widgetSettings, plugins, conversations, contactSessions, users)
    │
    ▼
Clerk (auth + org = tenant + billing webhook)
Vapi (only non-web channel — voice, via a "plugin" pattern)
AWS Secrets Manager (per-org secret storage, currently only for Vapi keys)
Sentry (error tracking)
```

Every conversation today originates from exactly one place: the embedded web widget (or a Vapi voice call attached to that same widget session). There is no webhook receiver for any external messaging platform, no cross-channel identity table, and no permission layer on top of AI tool calls.

## 2. Target state (OmniLinks)

```
                              CUSTOMER
      ┌───────────┬────────────┼────────────┬────────────┬───────────┐
      ▼           ▼            ▼            ▼            ▼           ▼
   Web Widget   WhatsApp    Instagram    Facebook     Telegram      SMS
  (apps/embed) (new adapter)(new adapter)(new adapter)(new adapter)(new adapter)
      │           │            │            │            │           │
      └───────────┴────────────┼────────────┴────────────┴───────────┘
                                ▼
                     CHANNEL ADAPTER LAYER   (new — branch 35)
              — normalizes every inbound event to one Message shape
              — every adapter implements: receiveWebhook(), sendMessage()
                                │
                                ▼
                  IDENTITY RESOLUTION SERVICE   (new — branch 39)
        — matches channel handle → existing `customers` record, or creates one
                                │
                                ▼
                    packages/backend/convex   (Echo's core, extended)
      ┌─────────────────────────┼─────────────────────────────┐
      ▼                         ▼                             ▼
 conversations            AI GATEWAY (new — 40)        ACTIONS ENGINE (new — 41)
 (+ channel field)     routes to OpenAI/Anthropic/    permission + approval layer
                       other by tenant config          wrapping every tool call
      │                         │                             │
      └─────────────────────────┴─────────────────────────────┘
                                ▼
                  supportAgent (Echo's existing Convex Agent, unchanged core loop)
                                │
                    ┌───────────┼────────────┐
                    ▼           ▼             ▼
                 Respond     Execute Tool   Escalate to Human
                    │           │             │
                    └───────────┴─────────────┘
                                ▼
                        AUTOMATION ENGINE (new — 42)
              — IF/THEN rules evaluated on conversation events
                                ▼
                   ANALYTICS / BI LAYER (new — 43)
        — resolution rate, escalation rate, cost/conversation, per channel
                                ▼
                          CUSTOMER CHANNEL (reply sent back via the adapter it came from)
```

Cutting across every layer: **security hardening (new — 44)** — audit log on every tool execution and human action, input sanitization before anything is interpolated into a system prompt, tenant isolation enforced at the query layer (not just by convention). And **usage-based billing (new — 45)** feeding tier enforcement from real per-tenant usage instead of the current binary active/inactive flag.

## 3. Component ownership map

| Component | Repo location | Status |
|---|---|---|
| Web widget UI | `apps/widget` | Keep unchanged |
| Embed loader | `apps/embed` | Keep unchanged (web-only; new channels don't need an embed script) |
| Dashboard UI | `apps/web` | Extend (integrations page becomes the channel-connect hub, billing page becomes tier-aware) |
| Conversation engine | `packages/backend/convex/{public,private,system}/conversations.ts`, `messages.ts` | Extend (add `channel`, `customerId`) |
| AI agent + tools | `packages/backend/convex/system/ai/*` | Extend (gateway wrapper, permission wrapper) |
| RAG / knowledge base | `packages/backend/convex/system/ai/rag.ts`, `private/files.ts` | Keep, note single-provider embedding as a gateway candidate later |
| Plugin pattern | `packages/backend/convex/{private,public,system}/plugins.ts`, `lib/secrets.ts` | Extend — reuse this exact pattern for WhatsApp/Telegram/Twilio credentials |
| Channel adapters | *(does not exist yet)* | New — `packages/backend/convex/channels/*` |
| Identity resolution | *(does not exist yet)* | New — new `customers` table + resolver function |
| Automation engine | *(does not exist yet)* | New — new `rules` + `events` tables |
| Analytics | *(does not exist yet)* | New — new aggregation table, computed incrementally on conversation close |
| Audit log | *(does not exist yet)* | New — new `auditLog` table |

## 4. Cross-cutting design decisions made once, here, so branch docs don't repeat them

- **Tenant isolation stays namespace/foreign-key based** (as Echo already does with `organizationId` and RAG `namespace`), not separate databases per tenant — cheaper to operate, and Convex's row-level functions already enforce it as long as every new table/query includes and checks `organizationId`.
- **All new channels implement the same adapter interface** (`receiveWebhook`, `sendMessage`) so the conversation engine and AI layer never branch on channel type — this is the concrete form of OmniLinks' "channel-independent" requirement.
- **The AI Gateway wraps, it doesn't replace** — `supportAgent`'s tool-calling loop stays exactly as Echo built it; only the model-selection line changes from a hardcoded provider to a per-tenant lookup.
- **The actions engine wraps, it doesn't replace** — existing tools (`search`, `escalateConversation`, `resolveConversation`) get a permission check bolted on; new tools (appointment booking, CRM writes) are added behind the same wrapper from day one.
