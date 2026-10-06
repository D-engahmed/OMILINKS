# AI Context Assembly — Implementation Note

> Status: **Implemented slice** (`ai/context.ts`, `CONTEXT_VERSION ctx1`,
> prompt `support-v2-ctx1`)

## 1. What the model receives

```text
tenant identity (agent name + purpose)
+ customer profile (display name)
+ budgeted recent history (most-recent turns first, truncated to budget)
+ tenant-scoped retrieved knowledge (relevance-gated upstream)
```

Knowledge and customer text stay framed as untrusted data. History is
deliberately budgeted (`maxHistoryChars`, default 6000; knowledge default
8000), most-recent-first: the full log is never sent. Truncation is reported
in `stats` so prompt drift stays observable.

## 2. Wiring

`ConversationPipeline.respondWithAi` assembles turns once via
`buildChatMessages`, loads the customer profile from the store, and builds the
system prompt with the governed agent identity (`ai-platform` passes
`agentName`/`agentPurpose` from the published agent). Ungoverned development
runs fall back to generic identity text.

## 3. Traceability

`ai_runs.prompt_version` now records `support-v2-ctx1`. Context schema changes
bump the prompt version; history truncation stats are not yet persisted per
run (observable via tests, durable per-run stats deferred).

## 4. Not yet built

- per-tenant tone/policy blocks (needs a tenant AI-settings surface);
- customer memory beyond profile + recent turns (summaries/facts ledger);
- multilingual quality measurement of the new template.
