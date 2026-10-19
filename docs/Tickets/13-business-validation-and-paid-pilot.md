# Business Validation and Paid Pilot — Ordered Tickets

**Status:** TARGET. Founder-led execution; one person may own several roles but every ticket must have explicit acceptance evidence.
**Companion plan:** [Business Execution Plan — First Paid BPO Pilot](../product/business-execution-plan-2026-10-20.md).

## How this track fits the backlog

This is a cross-cutting commercial track, not a late phase to wait for after the engineering backlog. **Start OML-T1201 immediately in parallel with OML-T1200.** T1200 blocks software delivery from the canonical repository; it must not block low-cost buyer interviews.

The objective is a paid, bounded pilot for one valuable support workflow, with safe operations and measured unit economics.

## Dependency map

~~~text
OML-T1200 Canonical source recovery ──────────────────────┐
                                                          v
OML-T1201 ICP + prospects -> OML-T1202 discovery -> OML-T1203 paid offer
                                                     |
                                                     v
                                    OML-T1204 vertical-slice freeze
                                                     |
                              OML-T0306 outbound + OML-T0307 WhatsApp
                              (or the single buyer-validated channel)
                                                     v
                                     OML-T1205 end-to-end live loop
                                                     |
                                     OML-T1206 operator + handoff
                                                     |
                                     OML-T1207 safe AI evaluation
                                                     |
                                     OML-T1208 launch readiness
                                                     |
                              OML-T1209 usage + direct-cost measurement
                                                     v
                                     OML-T1210 paid pilot operation
                                                     |
                                     OML-T1211 continue / pivot / stop
~~~

Reuse the existing detailed tickets: foundation (01), tenancy/identity (02), conversations (03), channels (04), workforce/routing (05), AI (07), billing (10), and finance/commercial control (12). This document adds business and pilot acceptance gates; it does not replace the domain contracts.

## OML-T1200 — Canonical Repository Recovery and Clean-Checkout Proof

**Status:** BLOCKED / TARGET until reconciled. **Priority:** P0. **Dependencies:** none.

**Problem:** The reviewed default branch does not contain the backend package referenced by root configuration and docs. Historical implementation evidence is not enough to develop or release reliably from the canonical branch.

**References:** README, workspace configuration, backend CI workflow, Docker Compose, implementation plan, and the historical backend-containing snapshot [58dfe38](https://github.com/D-engahmed/OMILINKS/commit/58dfe387e1fc8d8543ee2c9df4a9b369a3d4aec7).

**Scope:** inspect current main and merge parents; compare the known backend-containing tree and its later history; identify any newer changes; restore/reconcile on a fix branch; review conflicts; reconcile CI filters, scripts, and implementation claims; reproduce the documented commands from a clean checkout.

**Acceptance**
- [ ] A recovery PR explains the discrepancy and identifies restored/reconciled paths.
- [ ] No force push, blind reset, or unrelated feature changes are mixed into the recovery.
- [ ] Clean install using the pinned package manager succeeds.
- [ ] Backend lint, typecheck, build, tests, PostgreSQL tests, migrations, web checks, and widget build pass where supported.
- [ ] A green CI run exists on the exact proposed merge commit.
- [ ] Unavailable/environment-dependent tests are explicitly documented, not reported as passed.
- [ ] Status distinguishes historical implementation, present on current main, tested, and deployed.
- [ ] README/workspace commands refer to existing packages and scripts.

**Evidence:** PR diff, exact commit SHA, CI URL, test output, migration result, and code-to-ticket reconciliation table. Merely restoring files does not pass this ticket.

## OML-T1201 — Beachhead ICP and Prospect List

**Status:** TARGET. **Priority:** P0 commercial; runs in parallel with T1200. **Dependencies:** none.

**Problem:** “Small BPO” is too broad to guide selling or product scope.

**Scope:** hypothesize one initial profile: Egypt-based BPO/outsourced support operator with a recurring support program and measurable repetitive-work pain. List 20 plausible firms, identify a relevant operations/budget role for at least 12, and use an existing free spreadsheet as a lightweight CRM.

**Acceptance**
- [ ] ICP has inclusion/exclusion criteria and identifies buyer, daily user, technical/channel owner, and data approver as potentially different roles.
- [ ] 20 target organizations are listed with a specific reason for fit.
- [ ] 12 relevant contacts or credible introduction paths are identified.
- [ ] At least 10 personalized outreach attempts are sent or scheduled with dates and next steps.
- [ ] Each prospect has a stage: uncontacted, contacted, replied, discovery booked, qualified, disqualified, or nurture.
- [ ] Unnecessary sensitive personal data is not collected.
- [ ] No recurring CRM or lead-data expense is introduced.

**Evidence:** ICP one-pager, prospect tracker, message/call dates, status, and next action. A list of company names alone does not pass.

## OML-T1202 — Buyer Discovery and Workflow Evidence

**Status:** TARGET. **Priority:** P0 commercial. **Dependencies:** T1201.

**Problem:** Interest in AI is not evidence of a costly, funded support problem.

**Scope:** complete at least 6 qualified discovery conversations, aim for at least 3 with a budget/decision owner, conduct 3 workflow walkthroughs where possible, map process and exceptions, measure pain where data exists, and record procurement/data barriers. Use synthetic or redacted examples until data access is approved.

**Acceptance**
- [ ] Six completed interview records exist; at least three include buyer/budget authority, or the outreach blocker is explicitly recorded.
- [ ] Three workflow walkthroughs are documented where feasible, with start/end state, exceptions, handoff, and trusted knowledge source.
- [ ] At least two prospects identify a concrete recurring workflow and a method to estimate or measure its cost.
- [ ] Baseline fields recorded when available: relevant message volume, first response, resolution, escalations/corrections, agent effort, and current tooling cost.
- [ ] Buyer, technical access, security, procurement, and data approver are identified.
- [ ] At least one prospect agrees to review a specific paid-pilot proposal with a named decision process and next step.
- [ ] Direct observations are separated from founder interpretation; a compliment is not recorded as purchase intent.

**Evidence:** interview notes, workflow maps, baseline confidence labels, objection log, and synthesis memo.

**Fail action:** run another targeted outreach cycle or revise segment/problem. Do not compensate by adding software features.

## OML-T1203 — Paid Pilot Offer, Pricing Floor, and Buyer Decision

**Status:** TARGET. **Priority:** P0 commercial. **Dependencies:** T1202.

**Problem:** The 7,000 EGP ARPA in the existing financial model is an assumption, not a validated market price.

**References:** financial model, OML-T1107 pricing/package decision, Section 5 of the business execution plan.

**Scope:** create a four-week, bounded offer for one team/queue, one channel, one workflow, approved knowledge, human fallback, message/conversation cap, limited onboarding/support, measures, responsibilities, exclusions, data terms, end date, and exit/export path. Calculate price floor from current provider/AI/infrastructure estimates, onboarding/support hours valued at an explicit rate, payment costs where applicable, and intended contribution.

**Acceptance**
- [ ] One-page proposal defines in-scope and excluded work, responsibilities, cap, support window, duration, and success criteria.
- [ ] Pricing worksheet records dated assumptions, expected direct costs, founder/onboarding hours, floor price, deliberate discounts, and expected/low-case contribution.
- [ ] Estimated costs and provider-reported actual costs are distinct.
- [ ] Budget owner is asked for a concrete yes/no or procurement next step.
- [ ] At least two qualified prospects are invited to review the offer, or the blocker and revised acquisition action are recorded.
- [ ] A “no” and its reason are recorded as faithfully as a “yes.”
- [ ] No document claims validated price before there is paid/commitment evidence.

**Evidence:** proposal, worksheet, buyer response, objection log, and next-step date. If nobody will pay, revise offer/segment before broad build. A free, unlimited, open-ended pilot does not validate paid demand.

## OML-T1204 — MVP Scope Freeze and Pilot Acceptance Contract

**Status:** TARGET. **Priority:** P0 product. **Dependencies:** T1200 and T1202; T1203 must show a credible buyer/pilot path.

**Problem:** The long-term platform vision contains more scope than a lean pilot can deliver economically.

**Scope:** select one workflow and one accessible channel from buyer evidence; WhatsApp is the default hypothesis only if it matches the buyer’s actual volume and provider access is feasible. Freeze outcomes, exclusions, baseline, pilot threshold, responsibilities, and rollback. Use one BPO organization and one team/queue; defer full client-account/program/sector hierarchy until validated demand requires it.

**Acceptance**
- [ ] One user/problem statement is tied to discovery evidence.
- [ ] Channel and workflow are chosen with documented reasons.
- [ ] Vertical-slice diagram covers inbound, persistence, routing, AI/human decision, outbound, status, and cost attribution.
- [ ] In-scope work maps to existing or new ticket IDs; each exclusion has a defer reason.
- [ ] Baseline and success thresholds are agreed before rollout.
- [ ] Any feature lacking authorization, failure, and acceptance behavior is removed from scope.

**Evidence:** approved scope note, workflow diagram, test matrix, demo plan, and linked tickets.

## OML-T1205 — Complete One Real Channel: Inbound-to-Delivered Reply

**Status:** TARGET. **Priority:** P0 engineering. **Dependencies:** T1200 and T1204; reuse channel tickets OML-T0301–T0308.

**Problem:** An inbound widget or AI demo is not a complete support workflow. The chosen provider must accept an authorized response and the system must truthfully report delivery state.

**Scope:** provider verification/signature checks where supported, deduplication, normalization, canonical persistence, transactional event intent, outbound adapter/status updates, bounded retries, unknown outcomes, visible operator errors, secure secrets, and capped provider tests.

**Acceptance**
- [ ] Provider event is verified before trusted processing.
- [ ] Duplicate/replayed inbound events do not create duplicate canonical messages or duplicate intended downstream actions.
- [ ] Outbound operation has idempotency rules and documented timeout/unknown-outcome handling.
- [ ] UI distinguishes queued, accepted, sent, delivered, failed, and unknown only according to provider semantics.
- [ ] Tests cover invalid signature, duplicate/out-of-order event, timeout, rate limit, provider outage, retry, and unknown send outcome.
- [ ] Human takeover during an AI run prevents stale output from being sent.
- [ ] Correlation IDs link logs/metrics without exposing secrets or unnecessary message PII.
- [ ] Provider-backed test message completes the full path with persisted status evidence.

**Evidence:** sandbox trace, integration-test output, delivery-status record, failure/retry demonstration, and test-spend record.

## OML-T1206 — Operator Inbox, Claim, Human Takeover, and Onboarding

**Status:** TARGET. **Priority:** P0 product. **Dependencies:** T1200 and T1205; reuse existing workforce and web work.

**Scope:** authenticated authorized access, inbox and conversation history, ownership/control state, claim/assignment, human takeover, idempotent human reply, delivery status, simple onboarding, and a support path.

**Acceptance**
- [ ] A pilot operator can log in, select an authorized organization, open a conversation, claim/take over, reply, and see delivery state without a developer editing the database manually.
- [ ] Concurrent claim tests prove one authoritative owner or an explicit conflict.
- [ ] Stale AI cannot respond after human ownership changes.
- [ ] Guessed cross-tenant resource IDs are denied.
- [ ] Arabic/RTL is tested when the pilot requires Arabic; mixed Arabic/English text is legible.
- [ ] Empty/loading/failed/offline/permission-denied states exist.
- [ ] Polling freshness and load are measured before considering realtime transport.
- [ ] Operator actions are auditable and common failures are diagnosable.

**Evidence:** walkthrough with test data, negative-test output, and onboarding checklist.

## OML-T1207 — Safe AI/Knowledge Behavior and Evaluation Gate

**Status:** TARGET. **Priority:** P0 if AI answers customers; otherwise start agent-assist. **Dependencies:** T1204 and T1206; reuse AI/guardrail/evaluation tickets 07.

**Scope:** approved knowledge, bounded workflow and allowed intents, safe handoff, versioned eval set, and traceability of policy/model/run, evidence, outcome, usage, cost, and handoff reason.

**Acceptance**
- [ ] Allowed and disallowed/sensitive intents are documented.
- [ ] Evaluation examples include version, permission/source note, expected grounding, and expected handoff label.
- [ ] Pass/fail rubric and thresholds are set before the release run.
- [ ] Unsupported, low-relevance, invalid, or out-of-scope requests hand off.
- [ ] Control/authorization is rechecked before send; model output cannot bypass tenant permissions or write directly to persistence.
- [ ] Provider failure and budget exhaustion fail safely.
- [ ] Report includes sample count, answer correctness/grounding, false-answer rate, correct-handoff rate, latency, and cost with denominators.
- [ ] If thresholds fail, auto-reply stays disabled; agent-assist or human-only mode remains available.

**Evidence:** versioned evaluation set, results report, regression command, sample traces, and go/no-go decision.

## OML-T1208 — Pilot Operational, Privacy, and Security Readiness

**Status:** TARGET. **Priority:** P0 before real customer traffic. **Dependencies:** T1200, T1205, T1206; T1207 before auto-reply.

**Scope:** approved purpose and data access, contract/privacy/retention/deletion responsibilities, local qualified advice where required, secrets, least privilege, tenant boundaries, monitoring, backup/restore, incident response, provider terms, and channel access.

**Acceptance**
- [ ] Buyer accepts a written pilot agreement specifying workflow, cap, data responsibilities, support window, and exit process.
- [ ] Qualified review addresses applicable Egyptian privacy/data protection obligations and relevant transfer/sector issues.
- [ ] No production data enters the system before data access and processing are approved.
- [ ] Secrets are absent from source, client bundles, ordinary logs, and tickets.
- [ ] Tenant isolation, authorization, webhook authentication, and session-expiry negative tests pass.
- [ ] Backup is restored in a test environment and integrity is checked.
- [ ] Alerts cover provider failure, queue backlog, worker errors, cost/budget threshold, and delivery failures.
- [ ] Incident drill includes stop-send, human-only fallback, credential rotation, restore, and customer communication.
- [ ] Residual risks have owner and mitigation; critical risk is not silently accepted.

**Evidence:** readiness checklist, reviewed data/contract record, test output, restore log, alert test, and runbook drill.

## OML-T1209 — Pilot Usage Ledger and Customer-Level Unit Economics

**Status:** TARGET. **Priority:** P0 commercial/finance. **Dependencies:** T1205 and T1207; align with OML-T0606, OML-T1108, OML-T1109.

**Problem:** An unmetered pilot can appear successful while losing money through AI, provider charges, hosting, onboarding, or support.

**Scope:** record per-tenant/conversation usage, model/provider/operation, quantity, timestamp, price version, estimate/actual cost, and source. Include channel/provider and payment fees as applicable, founder onboarding/sales/support time at an explicit economic rate, and manual invoicing reconciliation.

**Acceptance**
- [ ] Each in-scope AI/provider operation has attributable usage or a documented data gap.
- [ ] Estimated and provider-reported actual costs are distinct; unknown is not zero.
- [ ] Duplicate/retried events do not double-count usage or cost.
- [ ] Price versions preserve reproducible historical calculations.
- [ ] Manual adjustments are permissioned/audited; attribution is tenant-safe.
- [ ] Customer report shows contracted/collected revenue, direct AI/channel/hosting/payment cost, onboarding/support hours, contribution, margin, and assumptions.
- [ ] Sales cost is not counted twice in fixed overhead and CAC.
- [ ] Sample size and confidence are stated; early CAC/churn is not presented as stable.
- [ ] Manual invoice reconciles to agreement and approved usage.

**Evidence:** reproducible usage export/report, provider record reconciliation, and updated financial model with dated actuals.

## OML-T1210 — Contracted Pilot Onboarding and Weekly Operating Review

**Status:** TARGET. **Priority:** P0 commercial/operations. **Dependencies:** T1203, T1208, T1209.

**Scope:** onboard one customer under the bounded offer, record a baseline before intervention, review performance/cost/exceptions weekly, and enforce the usage cap.

**Acceptance**
- [ ] Written buyer approval/contract or equivalent binding purchase commitment exists.
- [ ] Business owner, operator lead, technical/channel owner, and escalation contact are identified.
- [ ] Baseline and success criteria are signed off.
- [ ] Training, access, approved knowledge, data handling, cap, and rollback have been reviewed.
- [ ] Rollout is restricted to agreed channel, workflow, and user cohort.
- [ ] Weekly report covers usage, outcomes, errors, handoffs, latency, costs, support hours, spend versus cap, and open risks.
- [ ] Stop-send/human-only fallback has been rehearsed.
- [ ] No vendor commitment exceeds the approved budget.

**Evidence:** signed offer/contract, kickoff checklist, baseline, weekly snapshots, issue log, and spend ledger.

## OML-T1211 — Pilot Outcome and Continue/Pivot/Stop Decision

**Status:** TARGET. **Priority:** P0 strategic decision. **Dependencies:** T1210 and enough usage to measure agreed outcomes.

**Scope:** compare observed outcomes to baseline; reconcile revenue/collection, delivery costs, onboarding/support time, reliability, and renewal decision; update future tickets and forecast.

**Acceptance**
- [ ] Final report states time window, sample size, baseline, result, uncertainty, and protocol changes.
- [ ] Outcomes cover operational value, AI/handoff quality, reliability, customer decision, and unit economics.
- [ ] Actual cash spend and economic founder time are both reported.
- [ ] Buyer gives a documented continue/change/stop decision; preference is not substituted for payment evidence.
- [ ] Continue requires paid renewal or a specific paid next step.
- [ ] Bespoke implementation burden is assessed against SaaS, paid services, and pivot alternatives.
- [ ] Financial model is updated with forecast-versus-actual without erasing prior forecasts.
- [ ] Next investment, spend cap, unmet gates, and owner are written down.

**Evidence:** pilot report, buyer decision, renewal/order/invoice evidence where applicable, customer economics, and management decision note.

## Cross-ticket execution contract

Every ticket must reference documents actually read, current code and tests inspected, business/user outcome, explicit non-goals, domain/interface contracts, positive/negative/race/retry/failure tests, tenant/privacy/audit checks, observability, rollback/recovery, cash and founder-time estimates, acceptance artifacts, engineer explanation, and every affected documentation area.

Code existing, a screenshot, a one-time demo, or a BASELINE label cannot pass a ticket without its evidence.

## First two weeks: default sequence

- **Days 1–2:** start T1200; make the T1201 prospect tracker and list.
- **Days 2–5:** send tailored outreach and book calls; review recovery diff; do not add new recurring costs.
- **Days 5–8:** complete interviews/workflow maps; identify buyer and provider/data blockers.
- **Days 8–10:** synthesize evidence, prepare bounded paid offer, and calculate price floor.
- **End of week 2:** proceed to scope/product tickets only if the gate passed; otherwise run another discovery sprint or pivot.

## Stop rules

- No buyer evidence: stop feature expansion.
- No confirmed provider access: do not build an adapter from assumptions.
- No approved data handling: no production customer data.
- Unsafe AI evaluation: agent-assist/human-only, not auto-reply.
- Unknown/unreconciled costs: cap usage; do not claim margin.
- No paid continuation: a free pilot is not product-market fit.
