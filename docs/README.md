# OMILINKS Engineering Documentation

> **Role:** system operating specification and implementation memory  
> **Status:** target architecture / contracts; implementation status must be verified from code and tests

## Documentation Map

| Area | Purpose |
|---|---|
| requirements | behavior and measurable quality targets |
| architecture | system structure and deployment boundaries |
| architecture/decisions | durable architectural decisions |
| domain | aggregates, invariants and state transitions |
| api | wire-level client contracts |
| events | asynchronous contracts/reliability |
| integrations | provider adapter behavior |
| ai | execution, routing, guardrails, evaluation and economics |
| security | threat/control model |
| data | persistence, consistency, retention, recovery |
| product | UX, screen behavior, and launch strategy |
| finance | financial model, unit economics, cash flow and break-even |
| engineering | coding, Git, testing, release |
| engineering/traceability | requirement-to-evidence chain |
| [Tickets](Tickets/README.md) | ordered engineering backlog and delivery simulation |

## Business and Launch Execution

Start with [Business Execution Plan — First Paid BPO Pilot](product/business-execution-plan-2026-10-20.md) for the lean discovery sprint, paid-pilot gates, product scope, ticket dependencies, and unit-economics scorecard. The [Launch Strategy Review](product/launch-strategy-review-2026-10-20.md) explains the strategic trade-offs. Both are proposals until the gate evidence is recorded.

## Ticket Queue

The ordered ticket queue is maintained in docs/Tickets/. Start at docs/Tickets/README.md and execute in dependency order.

## Authority and implementation rule

Security and tenant-isolation invariants outrank convenience. Documentation is not implementation evidence; code, tests, CI, and operational evidence are required.

## Production-ready feature standard

```text
specification + implementation + negative tests + failure handling
+ observability + migration safety + recovery + release evidence
```

## Financial & Commercial Integration

Financial control is cross-cutting. Architecture, requirements, domains, APIs/events, integrations, data, security, product, AI, engineering, and Tickets must remain consistent with docs/finance/financial-model.md and the finance ticket track.

Cross-reference: [Financial Model](../finance/financial-model.md) and [Finance & Commercial Control Tickets](../Tickets/12-finance-commercial-control.md). Economic assumptions remain assumptions until replaced by measured evidence.