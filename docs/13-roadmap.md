# OmniLinks Engineering Roadmap

## Delivery rule

Build vertical slices that prove customer value and operational correctness.

## PR sequence

PR-001 Engineering baseline
- repository conventions
- CI
- environment configuration
- errors
- logging
- API conventions

PR-002 Persistence foundation
- PostgreSQL package
- migrations
- transaction helper
- outbox
- idempotency

PR-003 Identity and tenancy
- organizations
- authentication reference
- memberships
- tenant context
- platform/tenant planes

PR-004 Authorization
- roles
- permissions
- scoped access
- security middleware
- cross-tenant tests

PR-005 Business hierarchy
- clients
- programs
- sectors
- teams

PR-006 Workforce
- humans
- AI workforce references
- queues
- assignments
- presence

PR-007 Customer
- customers
- channel identities
- identity resolution

PR-008 Conversation
- conversations
- messages
- state transitions
- realtime

PR-009 Web channel
- widget/embed
- inbound/outbound
- support inbox

PR-010 Channel framework
- adapter contracts
- connections
- webhook lifecycle
- delivery lifecycle

PR-011 First external channel
- one provider implemented end-to-end

PR-012 AI runtime
- agents
- model abstraction
- streaming
- AI runs
- usage

PR-013 Knowledge
- ingestion
- versioning
- retrieval
- permissions

PR-014 Action engine
- actions
- auth
- approvals
- execution audit

PR-015 Hybrid routing
- AI/human routing
- queues
- escalation handoff

PR-016 Workflow
- triggers
- steps
- retries
- versioning

PR-017 BPO operations
- client/program dashboards
- queue operations
- client reporting

PR-018 Quality
- QA
- SLA
- AI evaluation

PR-019 Billing
- plans
- entitlements
- usage
- subscriptions
- Paymob adapter
- reconciliation

PR-020 Analytics
- operational projections
- workforce metrics
- AI metrics
- usage views

PR-021 Production hardening
- security review
- load tests
- resilience tests
- backup restore
- incident runbooks

## Release milestones

Alpha
- one tenant
- one real conversation channel
- human replies
- resolution
- basic operations view

Beta
- external channel
- AI agent
- knowledge retrieval
- human escalation
- authorized action

V1
- multi-client service-provider operation
- multiple channels
- human + AI workforce
- quality and SLA
- usage/entitlement billing
- analytics

## Anti-patterns

Do not add:
- microservices without extraction evidence
- new channels without adapters
- AI tools before action authorization
- billing limits enforced only in frontend
- analytics derived from mutable dashboard state
- empty applications that exist only to satisfy a diagram
