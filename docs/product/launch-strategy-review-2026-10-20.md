# OmniLinks Launch Strategy and Revised Execution Plan

**Review date:** 20 October 2026  
**Status:** Proposed operating plan for review; not evidence that launch gates have passed.  
**Scope:** Re-sequence the existing engineering plan around repository integrity, one validated customer, a complete live operating loop, and measured unit economics.

## Executive verdict

OmniLinks has a credible technical direction: a modular monolith, PostgreSQL as transactional source of truth, tenant-scoped authorization, durable asynchronous work, human takeover protection, AI tracing, and ticket-level engineering contracts. Keep those foundations.

The current plan's weakness is sequencing. It gives substantial weight to completing reusable domain kernels while the default branch does not currently contain the backend package described by the plan, and the documented launch path still lacks the real outbound channel loop. Completing more infrastructure before fixing the source-of-truth state and proving a buyer would increase sunk cost without proportionately increasing launch probability.

**Revised order:**

1. Restore and verify the canonical code baseline on a normal PR.
2. Choose one beachhead and secure a design partner before expanding scope.
3. Complete one real inbound-to-outbound customer conversation loop.
4. Make the operator experience and safe human handoff usable.
5. Prove security, privacy, failure recovery, and AI quality for a bounded pilot.
6. Measure usage and delivery cost; start with simple pilot invoicing.
7. Automate billing and expand features/markets only when paid usage justifies them.

Do **not** start the next billing phase on the assumption that the prior phases are present on main.

## 1. Repository evidence and a blocking inconsistency

The reviewed current default-branch commit is [ea96ef4](https://github.com/D-engahmed/OMILINKS/commit/ea96ef4c811f957ea3de65fdf9331452ab187ffc), created by merging PR #20 on 19 October 2026. Its Git tree still has no packages/backend directory; the path packages/backend/package.json returns 404, even though the root workspace, backend CI workflow, Docker Compose instructions, README, implementation plan, and ticket status language refer to the backend package and its capabilities.

The earlier merge commit [0203ba6](https://github.com/D-engahmed/OMILINKS/commit/0203ba6a057d1de9f853228764f89149e4474771) also has no backend in its resulting tree. However, its other parent, the historical code-containing snapshot [58dfe38](https://github.com/D-engahmed/OMILINKS/commit/58dfe387e1fc8d8543ee2c9df4a9b369a3d4aec7), contains packages/backend. This looks like a merge-tree/source-reconciliation regression. Compare history and diffs before restoring; do not infer the complete recovery from a single tree, and do not reset or force-push main.

The repository has a historical [Phase 7 workflow-engine branch](https://github.com/D-engahmed/OMILINKS/tree/feat/phase7-workflow-engine), but that is not a substitute for checking the current canonical tree. This review cannot see uncommitted local work.

### Required recovery gate

- Create a normal fix branch from current main; inspect the diff before changing anything.
- Restore/reconcile backend source from the appropriate known code snapshot, starting with the second-parent tree above, while preserving the newer documentation and reviewing any code differences.
- From a clean checkout, prove dependency installation, backend lint/typecheck/tests/build, PostgreSQL integration tests, web/widget builds, and the relevant migrations.
- Update the ticket statuses so that “implemented in a historical branch,” “present on main,” “tested on main,” and “deployed” are distinct states.
- Merge through a reviewed PR. A green check or a detailed ticket is insufficient if the checked-out tree does not contain the code being claimed.

**Exit criterion:** a clean checkout of main contains the backend, the documented commands work, CI is reproducible, and every claimed baseline maps to code plus test evidence.

## 2. Recommended beachhead: one Egyptian BPO pilot

For concrete founder-led steps and measurable acceptance thresholds, use the companion [Business Execution Plan — First Paid BPO Pilot](./business-execution-plan-2026-10-20.md) and ordered [Commercial Validation and Paid Pilot Tickets](../Tickets/13-business-validation-and-paid-pilot.md). Buyer discovery begins in parallel with repository recovery.

The longer-term vision points toward BPO/customer-operations software. For that reason, the recommended initial design partner is **one small Egypt-based BPO or outsourced support team, operating one client program and one WhatsApp support queue**. This is a proposed decision aligned to the stated ambition—not a claim that market demand has already been validated.

Do not launch simultaneously as a generic SMB inbox, an enterprise contact-center platform, and a regional AI workforce OS. They imply different buying processes, onboarding needs, operational requirements, and price expectations.

The pilot promise should be narrow:

> Help a small support team manage WhatsApp conversations in one inbox, draft or answer grounded routine questions, and hand uncertain or sensitive requests to a human without losing ownership or message history.

Keep the first workflow bounded to routine FAQs and simple information retrieval. Do not promise autonomous account changes, refunds, payments, or arbitrary external actions.

### Commercial validation gate

Before adding non-blocking infrastructure, conduct targeted discovery with the chosen buyer type and record:

- current message volume and channel mix;
- first-response and resolution baselines;
- agent time spent on repetitive questions;
- escalation reasons and failure cost;
- the knowledge sources the team actually trusts;
- who buys, who operates, and who approves data processing;
- willingness to pay for a bounded pilot.

**Required evidence:** at least one named design partner willing to provide a real workflow and evaluate a paid pilot, with a documented success definition. If you cannot reach that buyer, do not silently build for both BPOs and SMBs; revisit the beachhead decision explicitly.

## 3. Revised execution phases

### Gate 0 — Restore a trustworthy repository baseline

**Priority:** blocking.

Deliverables: code/source reconciliation, clean CI, migration validation, verified ticket statuses, and one canonical implementation branch. Do not begin new feature work until the repository is reproducible.

### Gate 1 — Buyer and pilot definition

Choose one buyer, one country (Egypt), one workflow, one launch channel, one offer, and a usage cap. Establish before/after measures with the design partner. Treat customer discovery as evidence collection, not a formality after engineering.

### Gate 2 — Complete one real channel loop

The Web Widget can remain useful for development and demonstrations, but it does not prove a WhatsApp business workflow.

Prioritize the existing outbound-delivery and WhatsApp tickets before advanced billing:

~~~text
provider webhook
  -> authenticate/verify
  -> deduplicate provider event
  -> normalize and persist canonical message
  -> commit state + outbox atomically
  -> route to AI or human
  -> create one authorized reply
  -> send through provider adapter
  -> persist provider delivery status
  -> retry safely / expose failure to operator
~~~

Required tests include duplicate webhooks, out-of-order events, timeouts, rate limits, invalid signatures, provider outage, unknown delivery outcome, retry after partial failure, and a human takeover during an AI run. The UI must not claim a message was delivered merely because it was queued.

### Gate 3 — Operator usability and onboarding

Minimum usable operator path:

1. authenticate and select the authorized organization;
2. see assigned/unassigned conversations and current control owner;
3. open a conversation with customer identity and message history;
4. claim or hand off atomically;
5. reply idempotently and see queued/sent/failed delivery state;
6. configure the one channel and the approved knowledge source;
7. see AI/human ownership, escalation reason, and usage/cost evidence.

Complete Arabic-first and RTL quality checks where the pilot needs them. Polling is acceptable initially if its delay and load are measured. Do not add WebSockets simply because they look more “production grade.”

### Gate 4 — Safe AI and pilot readiness

Start in agent-assist or tightly bounded auto-reply mode. Allow automatic answers only for the workflow that the evaluation evidence supports. Unknown, unsupported, sensitive, or low-confidence cases must hand off safely.

Build a representative, versioned evaluation set from approved/anonymized pilot examples. Pre-register the release thresholds for groundedness, correct escalation, refusal/hand-off behavior, latency, and cost. Record actual model/provider usage, not only estimated token counts.

Before real customer traffic, demonstrate:

- zero cross-tenant read/write paths in negative tests;
- duplicate inbound events do not create duplicate messages or duplicate AI runs;
- no AI reply after human takeover;
- secret management and webhook authentication;
- monitoring, error alerts, and queue/retry visibility;
- backup plus a successful restore drill;
- incident and customer-support runbooks;
- documented retention, deletion, consent, and data-processing responsibilities.

Egypt's Law No. 151/2020 and its executive regulations (Decision No. 816 of 2025) need a concrete launch review, not a generic “PDPL compliant” statement. Obtain qualified local legal advice for the platform's processor/controller role, notices/consent, contracts, transfers, retention, and data-subject requests.

### Gate 5 — Paid pilot and measured economics

Do not confuse internal usage metering with automated payment collection.

For the first bounded pilot, it can be reasonable to invoice and collect manually under an agreed pilot contract. Still record immutable usage and costs from day one, by organization, channel, conversation, model/provider, operation, and price version. Capture actual provider costs where available and clearly label estimates otherwise.

Track at minimum:

- active usage and resolved conversations;
- time to first response and resolution;
- AI answer acceptance, correction, and handoff rates;
- support/onboarding hours;
- cost per conversation and cost per resolved conversation;
- actual gross/contribution margin;
- payment collection and retention.

Do not promise unlimited usage until heavy-user scenarios have been costed. Keep channel/provider charges separate or explicitly passed through where the contract supports it.

### Gate 6 — Productize only what the pilot proves

After repeated paid usage, finish the commercial billing loop in this order: plan/entitlement rules, immutable usage events, aggregation, customer-visible usage, processor adapter, payment webhooks, reconciliation, invoice/payment history, and failure/recovery tests. Introduce automatic Paymob collection when it solves a real customer or operational problem.

Then prioritize quality analytics, calibration, advanced workflow actions/compensation, richer integrations, multiple model policies, and additional channels according to paid demand—not because the architecture diagram includes them.

### Gate 7 — Scale by evidence

Expand beyond Egypt or add a second buyer segment only after the first segment shows repeatable onboarding, stable retention, a controlled support burden, and healthy measured contribution margin. Verify every payment provider's availability and commercial terms for each product and jurisdiction; do not assume that one Paymob offering is available in every market.

## 4. What to defer now

Explicitly defer unless the design partner or measured workload requires it:

- UAE, Saudi Arabia, Qatar, and Morocco launches;
- Telegram, Instagram, Facebook, SMS, and SIP/VoIP adapters;
- microservices, Kafka, or Redis without a demonstrated capacity/failure-isolation need;
- multi-agent orchestration and advanced quality-based model routing;
- advanced vector search/reranking before deterministic retrieval quality is measured;
- workflow side-effect steps, parallel fan-out, and compensation engines;
- autonomous high-impact business actions;
- complex self-service subscription UX before a repeatable paid offer exists;
- executive analytics dashboards beyond metrics needed for the pilot decisions.

Keep the modular monolith, PostgreSQL source of truth, tenant-scoped authorization, outbox/idempotency contracts, durable worker foundations, and AI traceability. Those are good investments. Do not expand their generality without a real use case.

## 5. Pros and cons of the current plan

| Area | Pros | Cons / risk |
|---|---|---|
| Modular monolith | Faster iteration, simpler transactions, easier early tenant isolation | Requires discipline to stop modules becoming tightly coupled |
| PostgreSQL + outbox/workers | Strong transactional boundaries, durable retries, recoverable async work | Complex runtime mechanics have been developed ahead of a complete paid-channel loop |
| Tenant/auth/security | Correctly treats isolation and authorization as core invariants | Documentation cannot prove isolation; a missing or unverified canonical source prevents reliable release claims |
| AI governance | Guardrails, human takeover, run tracing, cost attribution, evaluation-first direction | AI platform depth can grow without proof that it reduces support effort or resolves buyer-important intents |
| Ticket system | Detailed dependency tracking and a serious definition of done | BASELINE labels can overstate delivery if code is not on the canonical branch; ticket completeness can become work in itself |
| Multi-channel, multi-market ambition | Large eventual market and extensibility | Excessive early breadth increases provider, compliance, support, and pricing complexity |
| Billing and financial planning | Correctly separates contribution, cash burn, CAC, and investment recovery | Outputs depend on unvalidated assumptions and a steep acquisition ramp; they are scenarios, not evidence |
| BPO orientation | Potentially differentiated via workforce routing, handoff, QA, and operational controls | BPO buyers demand stronger reliability, onboarding, reporting, and contractual assurances than an early-stage system may yet prove |

## 6. Financial-model pressure test

The existing [financial model](../finance/financial-model.md) explicitly labels its values as assumptions. Keep that warning prominent.

Its base inputs include 7,000 EGP blended monthly revenue/customer, 75% contribution margin, 3% monthly churn, 12,000 EGP CAC, 100,000 EGP starting fixed operating cost with 3% monthly growth, and a 600,000 EGP pre-launch investment assumption. The acquisition ramp rises from 2 new customers in month 1 to 14 in month 12 and then continues upward. The model therefore reports about 49.6 active customers and positive monthly operating cash flow in month 9, but cumulative cash flow is still approximately -1.229m EGP at that point; investment recovery is modeled around month 16.

The arithmetic may be internally consistent with those inputs. The weak point is evidentiary: there is no measured sales funnel proving the customer ramp, and no measured data yet proving ARPA, churn, CAC, support effort, or a 75% margin. The forecast should not be used as a funding commitment until those assumptions have evidence.

There is also a cost-definition ambiguity to resolve: fixed costs list sales/customer-acquisition expenses, while operating cash flow separately deducts new customers multiplied by CAC. Specify which sales costs are fixed overhead and which are included in fully loaded CAC so the same expense is not counted twice.

Finally, keep three separate outputs: cash needed to reach a sellable pilot, monthly operating break-even, and recovery of cumulative launch investment. They answer different questions.

## 7. Release invariants and success criteria

The following are non-negotiable for a pilot:

- zero cross-tenant access in the tested authorization matrix;
- duplicate inbound events do not create duplicate messages or duplicate AI runs;
- human takeover is authoritative; stale AI work cannot send afterward;
- outbound retries do not create uncontrolled duplicate side effects;
- delivery states distinguish accepted, queued, sent, failed, and unknown outcomes;
- every AI reply or handoff has a traceable policy/model/run record;
- data retention and deletion behavior are documented and tested.

Business thresholds should be agreed with the design partner against an observed baseline before launch. Do not invent a universal “90% automation” goal. A lower automation rate with reliable escalation can be commercially better than a high answer rate that creates expensive support failures.

## 8. Immediate execution order

1. **Repository integrity:** restore/reconcile packages/backend into a reviewed branch; reproduce all checks on the resulting source tree.
2. **Documentation integrity:** reconcile implementation-plan claims and ticket statuses to the canonical code, tests, and branch.
3. **Buyer gate:** confirm the single BPO design partner, one program, one workflow, channel, data access, success measures, and pilot commercial terms.
4. **Live loop:** complete outbound delivery and the WhatsApp adapter; make delivery failure visible and recoverable.
5. **Operator + safety:** finish the minimum inbox/handoff path, Arabic/RTL checks, evaluation and safety controls.
6. **Launch readiness:** verify privacy/data handling, monitoring, backup/restore, incident response, and support procedure.
7. **Economics:** meter real usage/costs and run the paid pilot with bounded usage; use findings to decide whether to automate Paymob billing or adjust the offer.
8. **Scale gate:** require repeatable retention and healthy measured unit economics before expansion.

## 9. Decision register

| Decision | Recommendation | Revisit trigger |
|---|---|---|
| First market | Egypt | First segment has repeatable retention and an expansion buyer is evidenced |
| First buyer | One small BPO/support operator with one client program | No viable design partner after targeted discovery; explicitly reselect, do not serve both segments |
| First channel | WhatsApp for the pilot; Web Widget for internal/dev demonstrations | Buyer evidence shows another channel is materially more valuable |
| Architecture | Modular monolith, PostgreSQL, durable outbox/worker | Measured throughput, failure isolation, or team ownership requires extraction |
| AI autonomy | Agent-assist or bounded FAQ replies with safe handoff | Evaluation evidence supports expanding only a defined intent class |
| Billing | Internal usage/cost metering first; simple pilot invoicing initially | Repeated subscription/payment operations justify automated collection |
| New infrastructure | None without a named consumer and operational requirement | Load/failure/caching measurements demonstrate the need |
| Geographic expansion | Deferred | First market has stable delivery, support, compliance, and economics |

**Bottom line:** the current plan has strong engineering foundations but is not a reliable launch plan until code and documentation are reconciled and a real customer loop is live. The next milestone should be a reproducible main plus one bounded paid-pilot path—not another broad architecture phase.

## References

- [Current default-branch commit](https://github.com/D-engahmed/OMILINKS/commit/0203ba6a057d1de9f853228764f89149e4474771)
- [Code-containing second parent snapshot](https://github.com/D-engahmed/OMILINKS/commit/58dfe387e1fc8d8543ee2c9df4a9b369a3d4aec7)
- [Existing Phase 7 branch](https://github.com/D-engahmed/OMILINKS/tree/feat/phase7-workflow-engine)
- [Egypt Personal Data Protection Center guidance](https://pdpc.gov.eg/assets/pdf-data/Guidelines/Privacy%20Notice.pdf)
- [Paymob Click terms and named operational markets for that offering](https://om.paymob.com/click-by-paymob/)
- [Current Egypt WhatsApp Business Platform rate reference (checked October 2026)](https://www.nonito.io/whatsapp-business-api-pricing/egypt)
