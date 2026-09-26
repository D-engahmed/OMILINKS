# OmniLinks Software Requirements Specification

Status: Baseline v1
Date: 2026-09-26

## 1. Purpose

Translate the product requirements into testable software requirements.

## 2. Functional requirements

### Identity and tenancy
SRS-001 The system shall authenticate users or validate an external identity token.

SRS-002 The system shall resolve a tenant from trusted membership context.

SRS-003 The system shall support multiple organizations per human identity.

SRS-004 Tenant-owned resources shall have an explicit ownership path to one organization.

### Authorization
SRS-005 Protected API operations shall evaluate permissions server-side.

SRS-006 Authorization shall support tenant, client, program, sector and team scope where applicable.

SRS-007 Frontend visibility shall never be the sole access control.

### Commercial hierarchy
SRS-008 The system shall support direct tenants without a ClientAccount.

SRS-009 The system shall support service-provider tenants with ClientAccount and Program hierarchy.

SRS-010 Sector and Team scope shall be explicit and queryable.

### Workforce
SRS-011 The system shall support human and AI workforce members.

SRS-012 Assignment shall identify queue/team/scope and acting worker.

SRS-013 Workforce state transitions shall be auditable.

### Customers
SRS-014 A Customer shall be independent of any one channel.

SRS-015 A Customer shall support multiple ChannelIdentity records.

SRS-016 Identity resolution shall avoid automatic low-confidence merges.

### Conversations
SRS-017 Messages shall be normalized into a channel-neutral representation.

SRS-018 Conversations shall support explicit state transitions.

SRS-019 A human agent shall be able to take over an AI conversation.

SRS-020 Conversation events shall be correlated for troubleshooting.

### Channels
SRS-021 Each provider shall implement the shared channel adapter contract.

SRS-022 Incoming webhooks shall be authenticated and deduplicated.

SRS-023 Outbound delivery shall expose normalized delivery state.

SRS-024 Provider-specific errors shall be classified as retryable or terminal.

### AI
SRS-025 AI agents shall reference explicit model, knowledge, tool and policy configuration.

SRS-026 AI providers shall be abstracted behind a provider interface.

SRS-027 AI retrieval shall respect tenant/scope authorization.

SRS-028 Tool execution shall perform server-side authorization independent of model output.

SRS-029 Designated high-risk actions shall support approval before execution.

SRS-030 Production prompt/workflow versions shall be immutable after publication.

### Automation
SRS-031 Workflows shall be versioned.

SRS-032 Workflow triggers shall be idempotent.

SRS-033 Workflow failures shall be durable and observable.

### Quality and analytics
SRS-034 Operational metrics shall be derived from authoritative events/state.

SRS-035 Quality evaluations shall be stored separately from raw operational logs.

### Billing
SRS-036 Feature access shall be entitlement-driven.

SRS-037 Usage events shall be idempotent.

SRS-038 Billing state shall support trialing, active, past_due, suspended and canceled.

SRS-039 Payment events shall support reconciliation.

## 3. Non-functional requirements

NFR-001 Security
Cross-tenant access must be blocked at application level and tested.

NFR-002 Reliability
External delivery can fail without corrupting authoritative state.

NFR-003 Observability
Critical synchronous and asynchronous operations carry correlation identifiers.

NFR-004 Performance
Large conversation and audit collections use bounded/cursor pagination.

NFR-005 Scalability
High-volume work can move to asynchronous workers without changing domain semantics.

NFR-006 Maintainability
Business rules are not duplicated between frontend and backend.

NFR-007 Compatibility
API-breaking changes require versioning or migration strategy.

NFR-008 Localization
The architecture supports Arabic/English and RTL/LTR.

NFR-009 Recoverability
Backups and migration recovery are tested before production claims.

NFR-010 Privacy
Sensitive customer content is excluded from default logs.

## 4. Traceability

PRD Goals -> SRS:
- tenant isolation -> SRS-002/004/005/006
- customer continuity -> SRS-014/015/016
- AI workforce -> SRS-025 through 030
- safe actions -> SRS-028/029
- BPO operation -> SRS-008/009/010
- usage billing -> SRS-036 through 039

## 5. Requirement rule

A requirement is complete only when it has:
- implementation owner
- acceptance test
- observability signal where relevant
- documentation reference
- failure behavior
