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
| product | UX and screen behavior |
| finance | financial model, unit economics, cash flow and break-even |
| engineering | coding, Git, testing, release |
| engineering/traceability | requirement-to-evidence chain |
| Tickets | ordered engineering backlog and delivery simulation |

## Ticket Queue

The ordered ticket queue is maintained in docs/Tickets/. Start at docs/Tickets/README.md and execute in dependency order.

## Authority and implementation rule

Security and tenant-isolation invariants outrank convenience. Documentation is not implementation evidence; code, tests, CI, and operational evidence are required.

## Production-ready feature standard

```text
specification + implementation + negative tests + failure handling
+ observability + migration safety + recovery + release evidence
```