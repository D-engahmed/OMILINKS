# OMNILINKS Architecture Documentation Index

This doc set answers one question per Echo tutorial branch: **what does the tutorial actually build here, and what (if anything) do we need to do differently to get to OmniLinks?**

Grounded in the real repo — every "Tutorial Scope" section below was written from an actual `git diff` between consecutive branches of `code-with-antonio/next15-echo`, not from the course description. Schema fields, file paths, and tool names are copied from the code, current as of `main` on 2026-09-10.

## How to read a branch doc

Every doc in `branches/` and `new-branches/` follows the same shape:

| Section | Purpose |
|---|---|
| Tutorial Scope | What this branch really adds (files, schema, behavior) — ground truth from the diff |
| OmniLinks Requirement | What the OmniLinks PRD needs at this layer |
| Decision | **Keep** (ship the tutorial code as-is) / **Extend** (add to it) / **Replace** (different approach needed) |
| High-Level Design | Only present when Decision is Extend/Replace |
| Low-Level Design | Only present when Decision is Extend/Replace — actual schema/interface/pseudocode |

Docs for purely cosmetic branches (theme, layout polish) are intentionally short — padding them with invented architecture would make the set less useful, not more.

## Canonical architecture documents

- [00-PRD.md](00-PRD.md) — product and operating model.
- [01-system-design.md](01-system-design.md) — current software architecture baseline.

The branch-by-branch Echo notes below are implementation references, not the OMNILINKS system architecture.

- 🟢 **Keep** — no material difference. Follow the tutorial.
- 🟡 **Extend** — tutorial code is the right foundation, but needs additions (new fields, new adapters, new guardrails) to satisfy OmniLinks.
- 🔴 **Replace** — the tutorial's approach doesn't fit OmniLinks' requirement at this layer; a different design is needed.

## Branch-by-branch index (existing tutorial branches)

| # | Branch | What it covers | Decision |
|---|---|---|---|
| 02 | [convex-package](branches/02-convex-package.md) | Monorepo + Convex backend scaffold | 🟢 Keep |
| 03 | [clerk-authentication](branches/03-clerk-authentication.md) | Auth (sign-in/up, middleware) | 🟢 Keep |
| 04 | [organizations](branches/04-organizations.md) | Clerk Organizations = tenants | 🟡 Extend |
| 05 | [error-tracking](branches/05-error-tracking.md) | Sentry | 🟢 Keep |
| 06 | [ai-voice-assistant](branches/06-ai-voice-assistant.md) | Vapi voice hook (first "channel") | 🟡 Extend |
| 07 | [dashboard-layout](branches/07-dashboard-layout.md) | shadcn dashboard shell | 🟢 Keep |
| 08 | [theme](branches/08-theme.md) | Design tokens / dark mode | 🟢 Keep |
| 09 | [widget-layout](branches/09-widget-layout.md) | Widget shell (header/footer) | 🟢 Keep |
| 10 | [widget-session](branches/10-widget-session.md) | `contactSessions` — the identity seed | 🔴 Replace (extend schema) |
| 11 | [widget-screen-router](branches/11-widget-screen-router.md) | Widget screen state machine | 🟢 Keep |
| 12 | [widget-loading](branches/12-widget-loading.md) | Org lookup + loading/error screens | 🟢 Keep |
| 13 | [conversations](branches/13-conversations.md) | `conversations` table + creation | 🟡 Extend |
| 14 | [ai-agents](branches/14-ai-agents.md) | Convex Agent (`supportAgent`), threads | 🟡 Extend |
| 15 | [infinite-scroll](branches/15-infinite-scroll.md) | Message pagination UI | 🟢 Keep |
| 16 | [widget-inbox](branches/16-widget-inbox.md) | Customer-side conversation list | 🟢 Keep |
| 17 | [dashboard-inbox](branches/17-dashboard-inbox.md) | Agent-side conversation list | 🟢 Keep |
| 18 | [dashboard-chat](branches/18-dashboard-chat.md) | Agent takes over a thread | 🟡 Extend |
| 19 | [ai-tool-calling](branches/19-ai-tool-calling.md) | `escalate`/`resolve` tools | 🔴 Replace (needs permission layer) |
| 20 | [generating-embeddings](branches/20-generating-embeddings.md) | File → text → embeddings pipeline | 🟡 Extend |
| 21 | [knowledge-base](branches/21-knowledge-base.md) | File upload UI | 🟢 Keep |
| 22 | [ai-search-tool](branches/22-ai-search-tool.md) | RAG search tool | 🟡 Extend |
| 24 | [vapi-plugin](branches/24-vapi-plugin.md) | Plugin pattern + Secrets Manager | 🟡 Extend (reuse pattern) |
| 25 | [vapi-data](branches/25-vapi-data.md) | Vapi assistants/numbers UI | 🟢 Keep |
| 26 | [widget-customization](branches/26-widget-customization.md) | `widgetSettings` table | 🟡 Extend |
| 27 | [widget-config](branches/27-widget-config.md) | Widget reads settings | 🟢 Keep |
| 28 | [widget-vapi](branches/28-widget-vapi.md) | Voice screen in widget | 🟢 Keep |
| 29 | [widget-improvements](branches/29-widget-improvements.md) | Contact screen polish | 🟢 Keep |
| 30 | [contact-panel](branches/30-contact-panel.md) | Agent sees customer metadata | 🟡 Extend |
| 31 | [subscriptions](branches/31-subscriptions.md) | Binary active/inactive billing | 🔴 Replace (needs real tiers + usage) |
| 32 | [api-improvements](branches/32-api-improvements.md) | Public API hardening | 🟡 Extend |
| 33 | [integrations-ui](branches/33-integrations-ui.md) | Embed snippet page | 🔴 Replace (becomes channel-connect hub) |
| 34 | [embed-script](branches/34-embed-script.md) | Vite-built widget loader | 🟢 Keep (web channel only) |

## New branches (not in the tutorial — required for OmniLinks)

| # | Branch | Why it doesn't exist in Echo |
|---|---|---|
| 35 | [channel-adapter-framework](new-branches/35-channel-adapter-framework.md) | Echo has exactly one inbound channel (the widget) — no adapter abstraction exists |
| 36 | [whatsapp-channel](new-branches/36-whatsapp-channel.md) | Not a course topic |
| 37 | [social-channels-instagram-facebook](new-branches/37-social-channels-instagram-facebook.md) | Not a course topic |
| 38 | [telegram-sms-channels](new-branches/38-telegram-sms-channels.md) | Not a course topic |
| 39 | [unified-customer-identity](new-branches/39-unified-customer-identity.md) | `contactSessions` has no cross-channel matching |
| 40 | [ai-gateway-multi-provider](new-branches/40-ai-gateway-multi-provider.md) | Tutorial hardcodes `openai.chat("gpt-4o-mini")` everywhere |
| 41 | [permissioned-actions-engine](new-branches/41-permissioned-actions-engine.md) | Tutorial's 3 tools have no roles/approval gate |
| 42 | [automation-rules-engine](new-branches/42-automation-rules-engine.md) | Tutorial is purely reactive, no IF/THEN engine |
| 43 | [conversation-intelligence-analytics](new-branches/43-conversation-intelligence-analytics.md) | No analytics tables/dashboards exist |
| 44 | [security-hardening](new-branches/44-security-hardening.md) | No audit log, no prompt-injection defense |
| 45 | [usage-based-billing-tiers](new-branches/45-usage-based-billing-tiers.md) | `subscriptions` table only stores active/inactive |

## Suggested build order

1. Ship branches 02→34 close to as-is (this is a fully working single-channel product — your MVP/demo).
2. Land **35 → 39** (channel framework + identity) before any channel-specific branch — every later channel adapter depends on this schema.
3. Land **40** (AI gateway) and **41** (actions engine) before adding new AI tools, so new tools inherit routing + permission checks from day one instead of being retrofitted.
4. Channels (**36, 37, 38**) can then be built in parallel, one PR each, all implementing the same adapter interface from 35.
5. **42–45** (automation, analytics, security, billing) layer on top once real multi-channel traffic exists to automate/measure/protect/monetize.

See [`00-PRD.md`](00-PRD.md) for the product requirements this build order serves, and [`01-system-design.md`](01-system-design.md) for the target architecture diagram.
