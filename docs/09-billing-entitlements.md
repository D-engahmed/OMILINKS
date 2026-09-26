# OmniLinks Billing and Entitlements

## Principle

Billing determines both what is charged and what a tenant is allowed to use.

## Model

    Plan
      -> Entitlements
      -> Subscription
      -> Usage
      -> Invoice
      -> Payment

## Plans

A plan may define:
- seats
- enabled channels
- conversations
- AI usage
- storage
- knowledge capacity
- workflows
- analytics
- support level

Do not encode business rules as plan-name conditionals.

## Entitlements

Examples:
- channels.whatsapp
- ai.agents
- ai.tools
- workflows
- analytics.advanced
- api.access

The backend evaluates entitlement state.

## Subscription

States:
- trialing
- active
- past_due
- suspended
- canceled

Transitions are explicit and auditable.

## Usage

Meters may represent:
- messages
- conversations
- AI runs
- AI tokens
- seats
- storage
- channel usage

Usage records are immutable facts.

Aggregation can be recalculated.

## Service-provider billing

Usage should support optional dimensions:
- client account
- program
- sector
- channel
- AI agent

This enables BPO/client reporting without a second billing system.

## Payments

Paymob is the initial regional integration target.

Payment provider adapters should expose:
- create payment
- verify payment
- process webhook
- reconcile

The billing core remains provider-neutral.

## Reconciliation

Reconciliation must compare:
- subscription state
- internal payment state
- provider state
- webhook history
- invoice state

Mismatches become explicit reconciliation records rather than silent corrections.

## Security

Do not store raw card data.

Actual PCI scope depends on final payment flow and provider architecture and must be documented before production.
