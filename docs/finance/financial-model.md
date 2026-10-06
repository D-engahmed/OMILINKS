# OMILINKS Financial Model and Break-Even Plan

> Status: Planning model v0.1
>
> This is a decision model, not audited accounting. Every number marked as an assumption must be replaced by measured company data before investment decisions are made.

## 1. What this model answers

The model separates four questions:

1. Build investment — what it costs economically and in cash to reach a sellable launch.
2. Operating burn — fixed monthly operating costs before revenue.
3. Unit economics — revenue, delivery cost, contribution margin and acquisition cost per customer.
4. Break-even — monthly operating break-even and recovery of launch investment.

Do not collapse these into one break-even number.

## 2. Repository evidence and the commercial gap

The repository's implementation plan says Phase 9 Billing is not yet implemented. The ordered ticket queue marks OML-T0901 through OML-T0914 as TARGET, including Paymob payment creation, webhook ingestion and reconciliation.

The AI platform already has a cost-control design and durable AI-run cost attribution. This is the correct technical foundation for measuring AI economics, but the commercial billing loop is not yet proven.

Therefore:

    GitHub architecture != cash invested
    GitHub code != revenue
    documentation != unit economics

The amount already spent by the founders cannot be inferred reliably from the repository.

## 3. Currency

Planning currency: EGP.

For USD translation, use approximately 52.39 EGP/USD as an October 6, 2026 Central Bank of Egypt reference. Refresh this rate when foreign-currency invoices are actually paid.

## 4. Launch pricing assumption

No final commercial price is established in the repository.

Base-case modeling assumption:

| Input | Base |
|---|---:|
| Blended monthly revenue/customer (ARPA) | 7,000 EGP |
| Contribution margin before fixed Opex | 75% |
| Monthly churn | 3% |
| CAC | 12,000 EGP |
| Month-1 new customers | 2 |
| Fixed Opex, month 1 | 100,000 EGP |
| Fixed-cost growth | 3% / month |
| Initial pre-launch investment assumption | 600,000 EGP |

The 7,000 EGP ARPA is a modeling input, not a validated market price.

The commercial model should eventually be:

    subscription revenue
    + metered overage
    + setup/onboarding where justified
    + pass-through provider charges where appropriate

Do not hide unpredictable AI and channel usage inside an unlimited low-price plan.

## 5. Cost structure

### Fixed costs

Include:

- engineering compensation or economic founder salary;
- sales and customer acquisition;
- operations/support;
- core hosting and managed database;
- observability/security/tooling;
- legal/accounting/company administration;
- software subscriptions.

The repository intentionally keeps Redis absent until a real consumer requires it. This is good cost discipline: infrastructure should follow demonstrated workload.

### Variable costs

The AI cost-control design identifies:

- model inference;
- embeddings;
- media processing;
- provider/tool usage;
- workflow execution.

Also include channel/provider fees and payment processing.

Paymob currently publishes a standard Egypt online-payment rate of 2.75% + 3 EGP per successful card transaction, with no monthly subscription fee on its standard plan. Negotiated enterprise rates may differ.

## 6. Unit economics

Gross Profit / Customer =
ARPA
- AI cost
- channel/provider cost
- payment processing
- usage-driven infrastructure
- other directly attributable delivery costs

Contribution Margin % =
Gross Profit / Customer / ARPA

CAC Payback Months =
CAC / Monthly Contribution per Customer

Base case:

    ARPA = 7,000 EGP
    Contribution margin = 75%
    Monthly contribution = 5,250 EGP
    CAC = 12,000 EGP
    CAC payback ≈ 2.3 months

This is healthy only if the 75% margin survives real production usage.

## 7. Operating break-even

Ignoring acquisition spend:

    Break-even recurring customers
    = Fixed Opex / contribution per customer
    = 100,000 / 5,250
    ≈ 19 customers

That is not sufficient for a growing SaaS business because new customers require acquisition spend.

Base-case monthly operating cash flow:

    customers × 5,250
    - fixed Opex
    - new customers × 12,000

With the customer acquisition ramp below, OMILINKS reaches positive monthly operating cash flow around month 9 at approximately 50 active customers.

## 8. Base-case customer acquisition ramp

Month 1-12 new customers:

    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14

After month 12:

    16, 18, 20, 22, 24, 26, ...

Customer churn is applied monthly at 3%.

## 9. Base-case milestones

| Month | Active customers | Revenue | Operating cash flow | Cumulative cash flow |
|---:|---:|---:|---:|---:|
| 1 | 2.0 | 14k | -113.5k | -713.5k |
| 6 | 18.7 | 130.8k | negative | negative |
| 8 | 40.8 | 285.6k | -16.8k | -1.243m |
| 9 | 49.6 | 347.0k | +13.6k | -1.229m |
| 16 | 144.9 | 1.014m | +340.7k | +16.0k |
| 20 | 231.8 | 1.622m | +681.4k | +2.195m |
| 24 | 339.3 | 2.375m | +1.128m | +6.007m |
| 36 | 763.3 | 5.343m | +2.982m | +30.907m |

Cumulative cash flow includes the 600,000 EGP pre-launch investment assumption.

### Base-case conclusions

- Operating break-even: approximately month 9.
- Investment recovery: approximately month 16.
- Peak modeled funding requirement after the 600k pre-launch assumption: approximately 1.24m EGP.
- Total modeled capital from zero, if the 600k has not yet been spent: approximately 1.84m EGP.

These are planning outputs, not guarantees.

## 10. Scenario pressure test

| Scenario | ARPA | Margin | Churn | CAC | Result |
|---|---:|---:|---:|---:|---|
| Conservative | 5,000 | 65% | 5% | 15,000 | Monthly break-even around month 32; launch investment not recovered within 36 months |
| Base | 7,000 | 75% | 3% | 12,000 | Monthly break-even around month 9; investment recovered around month 16 |
| Aggressive | 9,000 | 82% | 2% | 10,000 | Monthly break-even around month 6; investment recovered around month 10 |

The important result is not the exact month. Price, margin and churn dominate the economics much more than architecture.

## 11. Funding rule

Do not fund OMILINKS on the statement: "we only need enough money to finish development."

The financing boundary is:

    remaining build cost
    + launch cost
    + peak operating cash deficit
    + contingency

Use a 20% contingency until acquisition and usage data exist.

Using the base planning assumptions:

    pre-launch build assumption       600k
    peak additional operating need  ~1.24m
    ---------------------------------------
    modeled capital floor            ~1.84m
    20% contingency                  ~0.37m
    ---------------------------------------
    planning ceiling                 ~2.21m EGP

This is a planning ceiling, not a recommendation to spend 2.21m. The target is to reduce it after the first real customer cohort generates measured economics.

## 12. Metrics that can kill the company

Track:

    cost per conversation
    cost per resolved conversation
    cost per handoff
    cost per AI run
    cost per tool action
    gross margin per customer
    CAC
    CAC payback
    monthly churn
    net revenue retention
    support hours/customer

A cheaper model that increases human handoffs can make OMILINKS less profitable.

## 13. Cost-control requirements

Every expensive path should record:

    organization
    client/program where applicable
    agent
    conversation
    AI run
    provider
    model
    operation
    quantity
    price version
    estimated cost
    actual cost
    timestamp

Estimated and actual cost must remain separate.

Provider pricing must be versioned so historical gross-margin calculations do not silently change when a provider changes its prices.

## 14. Commercial gates

### Gate A — before serious infrastructure spending

Required:

- one ICP;
- one initial channel;
- one commercial package;
- target ARPA;
- expected usage envelope;
- expected support cost.

### Gate B — first 3 paying customers

Measure:

- actual recurring revenue;
- actual AI cost;
- actual channel cost;
- payment cost;
- support/onboarding hours;
- gross margin;
- retention.

Do not scale acquisition before these numbers exist.

### Gate C — 10 paying customers

Recalculate the model from measured data.

If gross margin is below 70%, change pricing, usage policy or cost structure before increasing sales spend.

### Gate D — 25 paying customers

Recalculate CAC payback and churn.

A growing customer count with weak retention is a leaky bucket, not proof of product-market fit.

### Gate E — 50+ paying customers

Consider aggressive hiring, larger infrastructure and multi-provider expansion only after economics remain healthy, unless a contracted BPO deployment justifies the earlier expense.

## 15. Existing billing work that unlocks trustworthy financial reporting

Execute the current billing queue in order:

1. OML-T0901 — Billing domain model
2. OML-T0902 — Plan catalog and versioning
3. OML-T0903 — Entitlement resolution
4. OML-T0904 — Subscription state machine
5. OML-T0905 — Immutable usage events
6. OML-T0906 — Usage aggregation and metering
7. OML-T0907 — Payment provider abstraction
8. OML-T0908 — Paymob payment creation
9. OML-T0909 — Payment webhook ingestion
10. OML-T0910 — Payment reconciliation
11. OML-T0911 — Invoice/payment history
12. OML-T0912 — Billing API and operator UI
13. OML-T0913 — Billing observability and reconciliation metrics
14. OML-T0914 — Billing end-to-end and failure tests

The model becomes materially more reliable once OML-T0905 through OML-T0913 produce measured data.

## 16. Monthly model update policy

Update the forecast every month.

Replace assumptions with actuals for:

- ARPA;
- new customers;
- churn;
- AI spend;
- channel spend;
- payment fees;
- support cost;
- infrastructure;
- CAC;
- refunds/credits.

Never overwrite the previous forecast. Keep forecast-versus-actual history.

## 17. Scale decision rule

Scale only while all three are true:

    contribution margin >= 70%
    CAC payback <= 6 months
    cash runway >= 6 months

If any condition fails, treat it as a pricing, cost, retention or financing problem. Do not automatically solve it by spending more.

## 18. External references

- Central Bank of Egypt — official exchange rates for October 6, 2026.
- Paymob — Egypt pricing, standard 2.75% + 3 EGP per successful card transaction.
- OpenAI API pricing — provider pricing should be represented as versioned inputs rather than hardcoded company economics.
