# AI Docs Change Log — 2026-10-06

Source: the architecture review that compared the AI-response drawing with the six AI specs, after pressure-testing each recommendation against the specs.

## New documents

| File | Why it exists |
|---|---|
| `context-engine.md` | Tenant context (enforcement vs business vs AI configuration), versioned immutable snapshot, tenant publish gate, customer memory layers, memory write path and poisoning controls, identity-merge rules, relevance gate, context budget and manifest |
| `human-handoff.md` | Handoff lifecycle, control ownership (`AI`, `HUMAN_PENDING`, `HUMAN`), reason codes, handoff packet, approval vs handoff, return to AI |

## Changes to existing documents

| File | Change |
|---|---|
| `agent-runtime.md` | Tenant context version in run context. `FAILED`, `TIMED_OUT`, `BLOCKED` can now route to `HANDOFF` (§21: no terminal outcome leaves a customer message unanswered and unowned, plus a sweeper). Context assembly now points to the Context Engine. Manifest and route decision referenced from step records. Post-run memory update (§22). Realtime constraints (§23, deferred) |
| `model-routing.md` | Capabilities are declared vs certified. A default model is a bounded preference, never a hard filter. Model lifecycle (`REGISTERED` → `SHADOW` → `CANARY` → `ELIGIBLE`). Fallback now respects data egress. Self-hosted capacity health. `dataClassification`, `script` added to the task contract. Realtime routing (deferred) |
| `guardrails.md` | Trust hierarchy separates tenant enforcement policy from tenant business context. Derived memory is lowest trust. Model confidence may only escalate, never de-escalate. New handoff reasons. Memory write guardrails (§13), handoff guardrails (§14), realtime output guardrails (§15, deferred) |
| `tool-runtime.md` | Tool writes denied while `HUMAN_PENDING` or `HUMAN`. Reserved tools `handoff.request` and (later) `memory.remember`. Approval is not handoff. Action history excludes UNKNOWN outcomes. Deep customer data fetched by read tools, not pre-loaded |
| `cost-control.md` | Self-hosted inference economics (§17). Background and shadow work budgets (§18). Realtime session metering (§19, deferred). Load-shedding order. Re-contacted conversations are not resolutions |
| `evaluation.md` | Model certification gate (§15). Tenant context change gate (§16). Retrieval, memory and handoff evaluation (§17). Statistical discipline (§18). Dialect and Arabizi in case contract. New hard safety gates |

## Review recommendations not adopted

| Review claim | Why |
|---|---|
| Tool flow and "final answer after tools" | Already covered by `tool-runtime.md` §3 and the runtime CONTINUE loop |
| Combined architecture diagram | Drops admission and budget, policy snapshot and the tool-result loop back to the model. Treats input guardrails as a context source |
| "Can AI safely solve?" as a model judgment | Contradicts `guardrails.md` §6 and §8. Replaced by policy inputs. The model can request a handoff and can never veto one |
| AthLLM hard-coded as default | Replaced by a preference gated by certification |

## Numbering changes (update any inbound links)

| File | Old | New |
|---|---|---|
| `agent-runtime.md` | §21 Definition of Done | §24 |
| `guardrails.md` | §13 Acceptance | §16 |
| `model-routing.md` | §17 Acceptance | §19 |
| `tool-runtime.md` | §16 Acceptance | §19 |
| `cost-control.md` | §17 Acceptance | §20 |
| `evaluation.md` | §15 Acceptance | §19 |

All other existing section numbers are unchanged. New sections were added before the acceptance section.

## Decisions to confirm

1. `handoff.request` cannot be removed from a tenant's tool allowlist. A tenant that wants no human escalation at all is not supported.
2. Tenants may choose `silent` or `holding` while a handoff is pending. They cannot choose silence for a conversation with no owner.
3. Tenant data egress defaults to **not allowed** for fallback unless tenant policy says otherwise.
4. Derived customer memory is marked **[Later]**. MVP uses customer record, conversation history and action history only.
5. Legal and residency requirements for each target market are not asserted anywhere. They need review by qualified counsel before the first production tenant.
