# OmniLinks Business Execution Plan — First Paid BPO Pilot

**Version:** 1.0  
**Review date:** 20 October 2026  
**Status:** proposed execution plan; none of the gates below should be marked passed without evidence  
**Operating constraints:** limited cash; potential contacts but no confirmed decision-maker; founder-led development and selling  
**Companion documents:** [Launch strategy review](./launch-strategy-review-2026-10-20.md), [ordered tickets](../Tickets/README.md), [commercial validation and pilot tickets](../Tickets/13-business-validation-and-paid-pilot.md), [financial model](../finance/financial-model.md)

## 1. Mission

Turn OmniLinks into a business that earns repeatable revenue by solving one costly support workflow for one defined buyer. Do not optimize for repository size, number of AI features, or architecture completeness.

The first milestone is not “MVP finished.” It is:

> A real support team uses OmniLinks on an agreed workflow, can recover safely when the system or provider fails, pays for the pilot, and provides measured evidence of value and delivery cost.

This plan is deliberately narrow. The first pilot may not prove product-market fit or scalability. It should prove whether the problem, offer, and operating loop merit the next investment.

## 2. What we know, what we assume, and what we must prove

### Known constraints

- Initial target segment selected for discovery: small BPO / outsourced support companies.
- We may be able to reach contacts, but no decision-maker or buyer commitment is confirmed.
- Cash budget is limited; avoid recurring tools and infrastructure before they are justified.
- The published `main` snapshot reviewed on 20 October 2026 does not contain `packages/backend`, despite documentation referring to it. Source recovery is a blocking engineering gate.

### Hypotheses to test

1. A small BPO has repetitive customer conversations that materially increase agent workload or miss service levels.
2. One narrowly scoped workflow is valuable enough for the BPO to fund a paid pilot.
3. A single channel—provisionally WhatsApp—covers enough of that workflow to make an end-to-end pilot useful.
4. A controlled AI answer plus safe human handoff reduces effort without increasing error cost.
5. The buyer can provide a lawful, approved data sample and a practical way to connect the selected channel.
6. The offer can produce positive contribution after AI, channel, infrastructure, onboarding, and variable support costs.

No hypothesis is “validated” by a compliment, a generic request for a demo, or free usage.

## 3. Beachhead and ICP

### Initial ICP hypothesis

An Egypt-based small BPO or outsourced customer-support team that:
- operates at least one ongoing customer-support program;
- receives enough repetitive customer enquiries for the problem to be costly;
- has a named operations leader who can describe performance and approve a pilot;
- can provide a bounded, approved FAQ or knowledge source;
- can test one workflow without replacing its existing support system entirely.

Do not invent an employee-count or message-volume threshold before discovery. Record actual team size, channel mix, and sample volume and then identify the segment pattern. If a numeric targeting filter is needed for the first prospect list, mark it as an outreach convenience, not a market fact.

### Buyer roles

Primary discovery target: owner/general manager, head of operations, BPO program manager, or contact-center/customer-support lead who owns service performance or budget.

Also identify:
- daily operator or team leader;
- person who controls the messaging account and technical access;
- person who approves customer-data processing or the pilot contract.

A friendly employee is not necessarily the buyer. A technical contact is not necessarily the budget owner.

### One-workflow rule

Select the workflow with the strongest combination of repetitive volume, measurable cost, accessible knowledge, tolerable risk, and buyer urgency. Routine FAQs are a candidate, not a foregone conclusion. Exclude refunds, account changes, payment instructions, and other consequential actions from autonomous execution unless separately authorized and proven safe.

## 4. First 10-business-day discovery sprint

Run buyer discovery in parallel with canonical repository recovery. Do not wait for a polished product to start selling, and do not use the discovery sprint as an excuse to postpone the repository fix.

### Activity targets (planning targets, not market statistics)

- Build a named list of 20 plausible BPO/support firms.
- Identify a relevant operations/budget contact for at least 12 of them.
- Send 10–15 tailored, non-spam outreach messages and request introductions where useful.
- Complete at least 6 real discovery conversations with people who understand the workflow; at least 3 should include a budget/decision owner.
- Conduct 3 workflow walkthroughs using a redacted or synthetic example.
- Ask 2 qualified prospects to evaluate a written paid-pilot proposal.
- Seek one written pilot commitment with a buyer, scope, access path, success measures, usage cap, and commercial terms.

These counts help enforce action; they do not establish statistical proof. If the funnel misses its targets, record where it failed instead of compensating with more engineering.

### Discovery questions

Ask about observed behavior, not “Would you use AI?”:

1. Walk me through the last ten enquiries of this type. What happened to each?
2. Which categories consume the most agent time or create repeated follow-up?
3. How do you measure first response, resolution, reopen rate, escalation, and SLA breaches today?
4. What tools and channels are already in use? What must not be replaced?
5. Where does the approved answer live? Who owns updates and exceptions?
6. What happens when the answer is wrong, the system is unavailable, or the customer asks for a human?
7. What did this problem cost last month in staff time, rework, refunds/credits, or SLA penalties, if measured?
8. Who owns the budget, signs the agreement, and approves data access?
9. What security, procurement, hosting, or data-processing requirements block a pilot?
10. What evidence would make you continue paying after a four-week pilot?
11. What have you already tried or paid for? Why did it succeed or fail?
12. Is a paid pilot possible? What would need to be true for the budget owner to approve it?

### Required evidence record

For each conversation, record date, role, segment fit, workflow, current process, actual observed pain, available baseline, urgency, buying authority, blocker, next action, and confidence level. Separate direct quotes/facts from founder interpretation. Do not store sensitive personal data unnecessarily.

### Gate B — Buyer/problem validation

Pass only if:
- at least 6 relevant discovery conversations are completed;
- at least 3 include a buyer or budget owner;
- at least 2 prospects expose a concrete, recurring workflow and a way to measure its cost;
- at least 1 prospect agrees to evaluate a bounded paid-pilot offer with a real decision process and named next step.

**Fail action:** do not build channel-specific product features yet. Do another targeted outreach cycle or explicitly revisit segment/problem. If the budget owner cannot be reached after two structured attempts, treat it as a channel/access problem to solve—not as proof that the product is wanted.

## 5. Offer and price discovery

Do not copy the existing 7,000 EGP ARPA assumption from the financial model as a launch price. It is unvalidated.

Prepare a four-week paid-pilot offer with:
- one organization and one team/queue;
- one chosen channel;
- one agreed intent/workflow;
- a defined message/conversation cap;
- bounded approved knowledge sources;
- human fallback;
- named onboarding and support hours;
- agreed success measures;
- explicit exclusions and customer responsibilities;
- data-handling/retention terms;
- an end-of-pilot decision meeting and export/exit path.

### Pricing method

1. Estimate the direct cash cost for the usage cap using current provider price information.
2. Estimate onboarding/support hours and value those hours at a stated founder economic rate, even when no salary is paid.
3. Calculate the minimum price that covers expected direct cost and a defined share of onboarding/support; disclose any intentional pilot discount separately.
4. Test the proposed price with the budget owner. Ask for a purchase decision, not a hypothetical willingness-to-pay answer.
5. Offer at most two clear package options; avoid custom scope that makes delivery impossible to repeat.

If a prospect only accepts a free, unlimited, or open-ended pilot, record that as evidence against the current offer unless there is a deliberate, capped learning experiment with a written end date. A free pilot is not proof of paid demand.

## 6. Minimal sellable vertical slice

Use the current code if it survives repository recovery. Do not rewrite the backend or expand abstractions unless a verified requirement forces the change.

### In scope

1. One BPO organization, with existing tenant authorization enforced.
2. One team/queue and one selected channel. WhatsApp is the default hypothesis, not a reason to bypass discovery or provider-access constraints.
3. Inbound event verification, deduplication, normalization, canonical message persistence, and transactional event intent.
4. A usable inbox with customer/conversation history, assignment, claim/handoff, and human takeover.
5. Outbound response through the selected provider with queued/sent/failed/unknown status and safe, observable retry behavior.
6. AI-assisted or narrowly bounded FAQ answers from buyer-approved knowledge. Unknown, unsupported, sensitive, or low-confidence cases go to a human.
7. Traceability of who/what produced a response, the relevant AI policy/model, usage, cost estimate/actual, and handoff reason.
8. Minimum operator onboarding/configuration, error visibility, and support runbook.
9. Tenant-isolation, webhook/authentication, duplicate/retry, and human-takeover regression tests.
10. A usage/cost ledger sufficient to measure the pilot; manual invoicing is acceptable initially.

### Explicitly out of scope until evidence justifies it

- multiple channel adapters;
- another country or currency;
- self-service subscription checkout and automated recurring collection;
- multi-agent orchestration;
- autonomous high-impact business actions;
- advanced workflow side effects, compensation, or parallel execution;
- complex customer-program/sector hierarchy before a real second program requires it;
- vector database/reranker upgrades without retrieval evidence;
- microservices, Kafka, or Redis without a measured need;
- a full analytics/data warehouse project.

### One end-to-end acceptance scenario

An approved test customer sends an inbound message. The system verifies and deduplicates the event, stores one canonical message, assigns the conversation, uses approved knowledge to draft/answer only when permitted, allows a human to take over, sends the authorized response through the provider, records provider status, records usage/cost evidence, and remains safe under duplicate events, timeouts, provider errors, and worker restarts.

A feature demo that stops at AI text generation does not pass.

## 7. Stage gates

### Gate A — Canonical repository restored

Pass when a reviewed code change restores/reconciles the backend, clean checkout succeeds, backend lint/typecheck/build/tests pass, PostgreSQL integration tests and migrations pass, web/widget checks pass, and ticket statuses are reconciled against code evidence. No new feature branch should be considered releasable until this gate is satisfied.

### Gate B — Buyer/problem validated

Use the discovery thresholds in Section 4. If this fails, stop feature expansion and revise the segment/problem/offer.

### Gate C — Vertical slice accepted

- All critical CI checks pass from a clean checkout.
- All contract tests and the agreed negative tests pass.
- Duplicate inbound delivery creates no duplicate canonical message or AI run.
- Cross-tenant access tests return the expected denial.
- Human takeover prevents stale AI output from being sent afterward.
- Outbound response status is never represented as delivered without provider evidence.
- Retries and unknown outcomes are visible and recoverable.
- Usage/cost can be attributed to the pilot tenant and conversation.
- No unresolved critical/high-risk issue remains without an explicitly approved mitigation.

### Gate D — Pilot readiness

- Written pilot scope, price, success measures, usage limits, and end date.
- Buyer-approved data source and channel access.
- Data-processing, privacy, retention/deletion, and responsibility review completed with qualified advice where required.
- Backup and successful restore evidence.
- Monitoring and alert routing verified.
- Human support and incident runbook tested.
- Baseline measurements recorded before AI is enabled.

No production customer data should be loaded until the security, access, and data-handling prerequisites are complete.

### Gate E — Paid pilot completed

A signed commitment alone is not success. Pass the pilot outcome gate only after collection/contract evidence and the agreed report show:
- whether the workflow reached real users;
- quality and correct handoff outcomes;
- baseline versus pilot operational measures;
- onboarding/support hours;
- direct cost and contribution estimate;
- buyer decision to continue, change scope, or stop.

### Gate F — Repeatability before scaling

Before adding fixed costs or another market, target:
- at least 3 paying customers in the same initial segment;
- repeatable onboarding with decreasing founder hours per customer;
- measured contribution margin at or above 70% or a documented, time-bound path to reach it;
- CAC payback at or below 6 months once CAC can be measured credibly;
- at least 6 months of cash runway after planned commitments;
- retention/repeat use evidenced over a meaningful billing period.

These are proposed scale gates. If the first 3 customers take very different product builds, do not disguise a services business as scalable SaaS. Either standardize the offer, charge for implementation, or revise the business model.

## 8. Lean spend policy

Because the absolute budget has not been specified, impose an operating rule rather than invent a currency ceiling:

- Pre-validation: use local development, existing equipment, free documentation/prospecting tools, and existing GitHub/CI. No new recurring SaaS contract.
- Before a paid pilot: no paid production hosting or expensive model usage unless required for a written, approved test and within a founder-set cash cap.
- Before provider integration: check account requirements and current charges; run a capped sandbox/test budget and alarms.
- Pilot: separate committed costs, variable costs, and refundable/one-time expenses; review actual spend weekly.
- Every vendor expense needs an owner, purpose, maximum authorized spend, cancellation date, and value/evidence expected.
- Track founder hours separately as cash cost and economic cost; unpaid work is not zero-cost economics.
- Keep customer funds and business cash assumptions distinct; update the model with actuals and dated assumptions.

The first budget decision should be a maximum cash amount the founder is willing and able to lose before buyer validation. Do not borrow or make long-term commitments to fund an unvalidated pilot.

## 9. Unit economics and weekly operating scorecard

Record by customer and week:

| Metric | Formula / source | Why it matters |
|---|---|---|
| Qualified outreach conversion | Completed buyer conversations / qualified outreach | Tests reachability and sales messaging |
| Discovery-to-pilot conversion | Paid pilot commitments / completed qualified discovery | Tests problem and offer |
| Time to first value | Time from kickoff to first successful real workflow | Measures onboarding friction |
| AI containment with quality | Eligible conversations resolved without human intervention and meeting quality threshold / eligible conversations | Measures useful automation; exclude unsafe answers |
| Correct handoff rate | Correctly escalated test/observed cases / cases that should escalate | Measures control quality |
| Cost per resolved conversation | Allocated variable delivery cost / successful resolved conversations | Captures AI/channel economics |
| Customer contribution | Collected revenue minus directly attributable delivery and payment costs | Shows whether serving the customer adds value |
| Contribution margin | Customer contribution / recognized customer revenue | Shows margin before fixed overhead |
| Fully loaded CAC | Attributable sales cash + valued sales labor + acquisition spend / new paying customers | Prevents free founder sales labor from hiding CAC |
| Onboarding cost | Onboarding hours × stated hourly value + direct setup cost | Reveals services burden |
| CAC payback | Fully loaded CAC / monthly contribution per customer | Shows how quickly acquisition is recovered |
| Retention / renewal | Active paid accounts and renewals by cohort | Distinguishes repeat value from novelty |
| Cash runway | Available unrestricted business cash / forecast monthly net cash burn | Controls survival risk |

**Cost-attribution rules**
- Do not count the same sales expense both as fixed overhead and fully loaded CAC.
- Separate estimated model costs from provider-reported actual costs.
- Include channel/provider, payment, model, media, usage-driven hosting, variable support, and onboarding.
- Treat founder time as an economic cost even if no cash salary is paid.
- Keep one historical copy of every forecast; never overwrite estimates with actuals without retaining the comparison.

For the first customer, CAC and churn will be too noisy to treat as stable statistics. Report sample size, range, and assumptions; do not manufacture precision.

## 10. Stop / continue / pivot rules

- **Continue discovery, no major build:** buyers confirm pain but no one will commit to a paid pilot.
- **Pivot segment or offer:** several qualified buyers describe different urgent problems, or the proposed workflow is not the source of their cost.
- **Stop channel implementation:** the selected provider cannot be accessed under acceptable cost/contract conditions, or the buyer's dominant workflow is elsewhere.
- **Do not enable AI auto-replies:** evaluation misses the agreed quality or escalation thresholds.
- **Pause the pilot:** unresolved data/security issue, untraceable outbound behavior, uncontrolled variable costs, or unreliable human takeover.
- **Do not scale:** margin, retention, CAC payback, or runway fails its gate. Fix price, usage, reliability, or segment before buying more growth.

## 11. Founder weekly cadence

- Monday: review pipeline, next buyer actions, blockers, spend cap, and engineering priority.
- Each workday: reserve one focused commercial block for outreach/follow-up until a paid pilot is signed.
- Engineering: complete one vertical increment at a time; keep changes small and reviewed.
- Friday: update the scorecard, actual cash ledger, risks, and forecast-versus-actual; decide continue/pivot/stop based on evidence.
- Demo weekly using test data; demo to a prospect only within the agreed scope and never expose another tenant's information.

## 12. Immediate order of execution

1. Create and work a reviewed repository-recovery ticket; do not mix a blind code restoration with unrelated product features.
2. In parallel, make the 20-company prospect list, contact the first 10–15 prospects, and book qualified discovery calls.
3. Keep a discovery log and identify one workflow with actual operational-cost evidence.
4. Write a bounded paid-pilot proposal and ask for a budget-owner decision.
5. Only after a credible pilot path exists, freeze the minimum vertical-slice scope and estimate its remaining delivery work.
6. Implement and test the full channel-to-human/AI-to-provider loop on the canonical branch.
7. Complete launch safety gates, agree baseline/success metrics, and start the paid pilot.
8. Reconcile unit economics and customer feedback, then decide whether to productize billing and additional capability.

**Operating principle:** recover the truth, sell before broadening, deliver one reliable workflow, measure actual economics, and expand only when repeatability is visible.
