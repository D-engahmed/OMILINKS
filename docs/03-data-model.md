# OmniLinks Data Model

## Database

PostgreSQL is the transactional source of truth.

Redis is for cache, rate limiting, coordination, short-lived state and worker support.

Object storage holds documents and media.

A vector index is derived from authoritative knowledge metadata.

## Common columns

Tenant-owned tables should normally include:
- id
- organization_id
- created_at
- updated_at when mutable

Use explicit foreign keys and database constraints.

Avoid JSON as the primary structure for fields used in authorization, reporting or joins.

## Table groups

Tenancy and access
- organizations
- memberships
- roles
- permissions
- membership_roles

Commercial hierarchy
- client_accounts
- programs
- sectors
- teams

Workforce
- workforce_members
- human_agents
- ai_agents
- queues
- assignments
- presence

Customer
- customers
- channel_identities
- customer_attributes
- customer_consents
- customer_tags

Conversation
- conversations
- conversation_participants
- messages
- message_attachments
- internal_notes
- conversation_events
- conversation_tags

Channels
- channels
- channel_connections
- channel_credentials
- inbound_events
- outbound_deliveries

Knowledge
- knowledge_bases
- knowledge_sources
- documents
- document_versions
- document_chunks
- retrieval_policies

AI
- model_providers
- models
- prompt_versions
- ai_runs
- ai_steps
- ai_usage
- ai_evaluations

Actions
- actions
- action_permissions
- action_executions
- approval_requests
- approval_decisions

Workflows
- workflows
- workflow_versions
- workflow_steps
- workflow_runs
- workflow_step_runs

Quality
- quality_reviews
- quality_scores
- sla_policies
- sla_events

Billing
- plans
- entitlements
- subscriptions
- usage_meters
- usage_records
- invoices
- payments
- payment_events

Integrations and reliability
- integrations
- integration_connections
- integration_credentials
- webhook_endpoints
- webhook_deliveries
- idempotency_keys
- outbox_events

Audit
- audit_events

## Ownership

Prefer organization_id on tenant-owned tables even when a relationship already implies the tenant.

The application must verify hierarchy consistency.

Examples:
program.organization_id equals client_account.organization_id
team.organization_id equals sector.organization_id
conversation.organization_id equals customer.organization_id

## Index principles

Large operational tables should use indexes based on actual access paths.

Typical examples:

conversations(organization_id, status, updated_at)
messages(conversation_id, created_at)
channel_identities(organization_id, provider, external_id)
assignments(organization_id, queue_id, status)
usage_records(organization_id, meter_id, occurred_at)

Do not create indexes without a query/use-case justification.

## Row-Level Security

RLS is defense in depth.

Application authorization remains mandatory.

For protected tables, RLS should enforce organization scope using a trusted request/job context.

Read policies use row visibility rules.

Write policies use WITH CHECK rules.

Background jobs must establish an explicit system/tenant context before accessing tenant data.

## Transactions

Transactions are required for:
- tenant provisioning
- membership and role changes
- assignment/state transitions
- approval transitions
- payment state changes
- usage recording
- outbox insertion

## Outbox

Business mutation and corresponding outbox record are committed together.

Outbox dispatcher publishes after commit.

This prevents events from representing a transaction that later rolled back.

## Idempotency

An idempotency record stores:
- scope
- key
- request hash
- status
- response reference
- timestamps

Reusing a key with a different request hash is an error.

## Retention

Retention is defined by data class:
- conversations/messages
- attachments
- webhook payloads
- AI execution traces
- audit records
- billing records

Deletion of application objects must not silently delete records required for audit or billing.
