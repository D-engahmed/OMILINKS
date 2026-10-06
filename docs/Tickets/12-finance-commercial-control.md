# Finance & Commercial Control Tickets

> Status: TARGET
>
> Purpose: force financial reasoning into the engineering lifecycle. These tickets are not spreadsheet-only tasks. Each ticket connects business assumptions to executable behavior, measured evidence, and a management decision.

## How to use this track

For every ticket:

1. Read the linked source documents before implementation.
2. Record what the existing system already guarantees.
3. Record what is still target architecture.
4. Define the business question, domain invariant, and financial impact.
5. Implement the smallest vertical slice.
6. Add positive, negative, concurrency/idempotency, and failure tests where relevant.
7. Add observability.
8. Produce evidence: test output, measured data, SQL/result, dashboard evidence, or decision record.
9. Update the financial model with actuals.
10. Explain the ticket in your own words before marking DONE.

A ticket is not DONE because a table, endpoint, UI, build, or generated code exists. DONE requires behavior, failure handling, financial meaning, and evidence.

## Mandatory reading chain

Read these before starting the finance track:

| Document | Why it matters |
|---|---|
| docs/README.md | authority, documentation map, production-ready feature standard |
| docs/requirements/functional-requirements.md | invariants, billing, events, security, observability |
| docs/architecture/HLD.md | source of truth, system boundaries, sync/async split |
| docs/engineering/implementation-plan.md | actual phase order and implementation reality |
| docs/ai/cost-control.md | AI cost taxonomy, budgets, attribution, estimate vs actual |
| docs/ai/model-routing.md | model/provider pricing context and cost-aware routing |
| docs/product/UX-flows.md | truthful billing and operator states |
| docs/Tickets/README.md | ticket lifecycle and definition of done |
| docs/finance/financial-model.md | current assumptions, break-even and cash model |
| docs/Tickets/10-billing.md | billing contract when the referenced ticket file is available |

### Reading gate

Before coding, answer:

    What problem does the document solve?
    What invariant does it establish?
    What does it deliberately NOT implement?
    What evidence would prove it works?
    How does it affect money?

Put these answers in the ticket evidence.

# OML-T1101 — Financial Control Operating Model

**Goal:** establish the canonical financial vocabulary and accounting boundary.

**Financial question:** Can we explain where every meaningful EGP of OMILINKS cash went and why?

**Required reading:** docs/finance/financial-model.md; docs/README.md; docs/requirements/functional-requirements.md; docs/architecture/HLD.md.

**Design scope:** distinguish cash, economic cost, revenue, collection, fixed cost, variable cost, CAC, build investment, refunds, fees, and reconciling states.

**Evidence:** accounting glossary, mapping of real expenses to categories, one sample month ledger.

**Failure cases:** duplicate expense, uncategorized cash movement, historical record changing meaning.

**Done:** another engineer can explain every field and why it belongs in the model.

# OML-T1102 — Founder Investment & Build Cost Ledger

**Goal:** measure what has actually been invested to make OMILINKS exist.

**Required reading:** docs/finance/financial-model.md; docs/engineering/implementation-plan.md; docs/Tickets/README.md.

Track both cash build cost and economic build cost. Founder time is not economically free.

Each entry records date, category, amount, currency, payer, purpose, proof/reference, and cash-versus-economic classification.

**Evidence:** dated investment ledger and founder-hour valuation policy.

**Done:** replace the planning placeholder for build investment with a defensible actual figure.

# OML-T1103 — Infrastructure & SaaS Cost Inventory

**Goal:** build a complete monthly infrastructure bill of materials.

**Required reading:** docs/architecture/HLD.md; docs/ai/cost-control.md; docker-compose.yml; .env.example.

Classify every dependency as required at launch, required after first customer, required after scale, or optional.

Include database, compute, storage, observability, CI/CD, identity, domains, AI/model providers, embeddings, channel providers, payments, and support tools.

**Evidence:** monthly cost floor, expected range, and trigger for each new cost.

**Done:** every recurring infrastructure expense has a technical reason and a financial reason.

# OML-T1104 — Engineering Burn & Delivery Economics

**Goal:** convert the remaining engineering queue into a realistic delivery-burn model.

**Required reading:** docs/Tickets/README.md; docs/engineering/implementation-plan.md; every ticket specification being estimated.

Model: engineering hours × economic hourly rate + direct tooling + environment cost.

Track planned hours, actual hours, blocked time, rework, review/QA, deployment, and incident/recovery time.

**Evidence:** phase-by-phase burn table tied to ticket IDs.

**Done:** answer how much another 30 days of development costs, with assumptions visible.

# OML-T1105 — Go-Live Cash Gate

**Goal:** calculate the cash required to make OMILINKS genuinely sellable, not merely runnable locally.

**Required reading:** docs/engineering/implementation-plan.md; docs/architecture/HLD.md; docs/product/UX-flows.md; docs/requirements/functional-requirements.md; docs/finance/financial-model.md.

Launch must include the minimum safe commercial slice: identity, tenancy, conversation core, one real channel, outbound delivery, human handoff, AI safety, billing/payment, monitoring, backup/recovery, and support process.

Budget formula:

    remaining build cost + launch infrastructure + launch operations + contingency

**Evidence:** launch checklist plus cash-to-launch statement.

**Done:** there is a defensible number called Cash to Launch.

# OML-T1106 — First Customer Acquisition & Onboarding Economics

**Goal:** calculate the cash consumed between live product and first paying customer.

**Required reading:** docs/product/UX-flows.md; docs/finance/financial-model.md; relevant customer and channel tickets.

Measure lead generation, sales labor, demos, trials, onboarding, integration/setup, support, discounts, and payment activation.

Separate pre-first-customer spending from recurring delivery cost and customer-specific CAC.

**Evidence:** first-customer cost statement and actual timeline.

**Done:** first user is represented by a measurable economic event, not only a date.

# OML-T1107 — Pricing & Packaging Decision

**Goal:** turn the product architecture into a commercial offer that does not subsidize unpredictable usage.

**Required reading:** docs/finance/financial-model.md; docs/ai/cost-control.md; docs/ai/model-routing.md; docs/product/UX-flows.md; billing requirements.

Define plan, included usage, overage, limits, fair-use policy, onboarding, provider pass-through charges, AI usage policy, and support tier.

Stress test the plans against light, normal, heavy, abusive, and high-handoff customers.

**Evidence:** price, expected COGS, expected contribution, worst-case contribution for every plan.

**Done:** price is justified from value and cost structure rather than competitor imitation.

# OML-T1108 — Usage & Cost Metering Vertical Slice

**Goal:** make production economics measurable.

**Required reading:** docs/ai/cost-control.md; docs/ai/model-routing.md; docs/requirements/functional-requirements.md; OML-T0606; OML-T0609; OML-T0610.

Attribution must support organization, client/program where applicable, agent, conversation, run, provider, model, operation, quantity, price version, estimated cost, actual cost, and timestamp.

Estimated and actual cost are separate facts.

Test duplicate usage, missing provider usage, unknown price, price-version changes, cross-tenant attribution, and retry without double counting.

**Evidence:** production-like sample tracing cost from event to customer.

**Done:** real COGS per customer can be calculated.

# OML-T1109 — Unit Economics Engine

**Goal:** calculate customer-level economics from measured facts.

**Required reading:** docs/finance/financial-model.md; docs/ai/cost-control.md; OML-T1108; billing tickets.

Outputs: ARPA, COGS, gross profit, contribution margin, CAC, CAC payback, support cost, cost per conversation, cost per resolution, and cost per handoff.

Core formulas:

    Contribution = Revenue - Direct Costs
    Contribution Margin = Contribution / Revenue
    CAC Payback = CAC / Monthly Contribution
    Planning LTV approximation = Monthly Contribution / Churn

Do not call the last formula true LTV until cohort evidence exists.

**Done:** adding a customer can be evaluated as value creation or value destruction.

# OML-T1110 — Revenue, Churn & Cohort Model

**Goal:** replace top-line customer-count assumptions with cohort economics.

**Required reading:** docs/finance/financial-model.md; docs/product/UX-flows.md; billing state-machine tickets.

Track trials, activation, conversion, MRR, expansion, contraction, churn, reactivation, refunds, and failed payments.

Compare logo churn, revenue churn, gross revenue retention, and net revenue retention.

**Evidence:** monthly cohort table and variance analysis.

**Done:** revenue forecasting comes from observed cohort behavior rather than a straight-line customer-count guess.

# OML-T1111 — Cash Flow Forecast & Runway Engine

**Goal:** produce the cash curve needed for financing decisions.

**Required reading:** docs/finance/financial-model.md; OML-T1102 through OML-T1110; relevant docs/data material.

For each month record opening cash, cash in, cash out, net cash flow, closing cash, and runway.

Separate build investment, fixed operating spend, variable delivery costs, CAC, fees/taxes, and one-offs.

**Evidence:** 36-month base forecast plus retained forecast-versus-actual history.

**Done:** answer how long OMILINKS survives when sales are slower than plan.

# OML-T1112 — Break-Even Engine

**Goal:** calculate both operating break-even and investment recovery.

**Required reading:** docs/finance/financial-model.md; OML-T1109; OML-T1111.

Operating break-even:

    monthly contribution >= fixed operating costs + acquisition spend

Investment recovery:

    cumulative cash flow >= 0

Outputs: break-even revenue, break-even customers, break-even month, investment-recovery month, peak cash deficit, and required financing.

**Evidence:** reproducible calculations with visible inputs and formulas.

**Done:** another engineer can reproduce the answer without trusting your spreadsheet.

# OML-T1113 — Scenario, Stress & Failure Modeling

**Goal:** attack the business model before the market does.

**Required reading:** docs/finance/financial-model.md; docs/ai/cost-control.md; docs/ai/model-routing.md; OML-T1111; OML-T1112.

Required cases: conservative, base, aggressive.

Stress at minimum: ARPA -30%, churn ×2, CAC ×2, AI cost ×2, first customer delayed six months, sales at half forecast, payment failure, provider price increase, heavy customer usage.

**Evidence:** peak burn, runway, break-even month, investment recovery, and capital required for every scenario.

**Done:** identify the single assumption and combination of assumptions most capable of killing the company.

# OML-T1114 — Finance Observability & Forecast-vs-Actual

**Goal:** make financial truth observable from operating records.

**Required reading:** docs/ai/cost-control.md; docs/requirements/functional-requirements.md; docs/finance/financial-model.md.

Minimum reporting: cash balance, MRR, COGS, gross margin, operating burn, CAC, payback, churn, active customers, AI spend, channel spend, cost per resolution, forecast versus actual, runway, and distance to break-even.

Financial reports must reconcile to source-of-truth records and must survive duplicate usage, late payment, refunds, provider reconciliation, missing price versions, and unknown external outcomes.

**Done:** nobody can manually edit a dashboard to make the business look healthier.

# OML-T1115 — Capital & Scale Decision Gate

**Goal:** define when OMILINKS should continue spending, reduce burn, change pricing, pause acquisition, or raise capital.

**Required reading:** all finance-track tickets; docs/Tickets/README.md; docs/engineering/implementation-plan.md.

Initial provisional guardrails:

    contribution margin >= 70%
    CAC payback <= 6 months
    cash runway >= 6 months

These are guardrails, not laws. Replace them when customer evidence justifies better thresholds.

**Evidence:** recurring decision record containing actuals, forecast, variance, root causes, decision, and next threshold.

**Done:** capital allocation follows a repeatable process rather than founder intuition.

# Dependency Map

    T1101 -> T1102 -> T1105 -> T1106 -> T1107 -> T1108 -> T1109 -> T1110 -> T1111 -> T1112 -> T1113 -> T1114 -> T1115
       |       |       |
       +------ T1103 --+
       |
       +------ T1104 --+
       |
       +------ AI cost control / OML-T0606+ feeds T1108
       +------ Billing OML-T0901..0914 feeds T1108 and T1110

# Hard Gates

Gate 1 — Live: OML-T1105 accepted.
Gate 2 — First paying customer: OML-T1106 accepted with real CAC/support data.
Gate 3 — 10 customers: OML-T1108 and OML-T1109 produce measured economics.
Gate 4 — Break-even forecast: OML-T1111 and OML-T1112 are reproducible.
Gate 5 — Scale: OML-T1113 through OML-T1115 accepted.

# Anti-Copy/Paste Gate

Before DONE, explain:

1. What business problem does this ticket solve?
2. Which document defines the contract?
3. Which domain owns the rule?
4. Which database/event state is the source of truth?
5. Which external systems can fail?
6. What happens on duplicate, retry, timeout, or race?
7. What metric proves success?
8. Which financial number changes when it works?
9. What management decision does the evidence enable?
10. What evidence would prove the implementation is wrong?

# Final Financial Chain

    Engineering tickets
        -> build cost
        -> go-live cash
        -> acquisition
        -> first paying customer
        -> usage / COGS
        -> contribution margin
        -> MRR + churn
        -> cash flow
        -> peak funding requirement
        -> operating break-even
        -> investment recovery
        -> scale decision

The objective is not perfect prediction. The objective is to make important assumptions visible, measurable, challengeable, and replaceable with evidence.

# Enterprise Execution Contract — Applies to Every Ticket Above

The short Outcome/Acceptance text is not the implementation specification. Every ticket must be executed through discovery, design, implementation, evidence, and explanation.

## Mandatory pre-work

Read the linked source documents and inspect current code/tests. Record current behavior, target behavior, contradictions, assumptions, dependencies, and what is explicitly out of scope. Do not infer implementation status from documentation alone.

## No copy/paste implementation rule

Before coding, write a compact design note: current state, desired state, invariants, sequence/state diagram when useful, data changes, failure matrix, test matrix, observability plan, cost/revenue impact, and acceptance-evidence plan. AI may assist implementation, but the engineer must own and explain the design.

## DONE gate

DONE requires specification, implementation, positive tests, negative tests, failure handling, observability, migration safety, recovery, documentation synchronization, review, CI, and acceptance evidence. Documentation/code contradictions block completion until explicitly resolved.