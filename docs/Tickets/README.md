# OmniLinks Ordered Engineering Tickets

> Canonical execution backlog for the OmniLinks engineering simulation. Tickets are ordered by dependency, not by convenience.

## Execution sequence

```text
00 Ticket Governance
01 Engineering Foundation
02 Tenancy and Identity
03 Customer and Conversation Core
04 Channels and Webhooks
05 Workforce and Routing
06 Event and Worker Runtime
07 AI Platform
08 Workflows
09 Quality
10 Billing
11 Production Hardening
```

## Status semantics

- BASELINE: represented by the current implementation/engineering plan; re-validate with executable evidence before treating it as production-ready.
- TARGET: planned and not yet established by implementation/evidence.
- DEFERRED: explicitly deferred until product, scale, or authorization requirements justify it.

## Standard lifecycle

```text
BACKLOG -> READY -> IN PROGRESS -> IN REVIEW -> CI -> QA -> READY TO MERGE -> DONE
                                         \-> BLOCKED
```

## Standard branch naming

```text
feat/OML-T0903-entitlement-resolution
fix/OML-TXXXX-short-description
docs/OML-TXXXX-short-description
```

## Ticket Definition of Done

```text
specification
+ implementation
+ tests + negative tests
+ failure handling
+ observability
+ migration safety
+ recovery
+ PR review
+ CI
+ acceptance evidence
```

## AI ticket rule

```text
dataset version -> baseline -> metric -> regression threshold -> release evidence
```

## Async/event ticket rule

```text
duplicate delivery + retry + timeout + lease loss + dead letter + replay + unknown external outcome
```

## Ordered master map

| # | Ticket | Outcome | Status |
|---:|---|---|---|
| 001 | [OML-T0000](./00-ticket-governance.md#oml-t0000) | Ticket Operating Model | BASELINE |
| 002 | [OML-T0001](./01-foundation.md#oml-t0001) | Repository module boundaries | BASELINE |
| 003 | [OML-T0002](./01-foundation.md#oml-t0002) | Configuration and environment validation | BASELINE |
| 004 | [OML-T0003](./01-foundation.md#oml-t0003) | Database migration system | BASELINE |
| 005 | [OML-T0004](./01-foundation.md#oml-t0004) | Structured logging and correlation | BASELINE |
| 006 | [OML-T0005](./01-foundation.md#oml-t0005) | Test harness and CI gates | BASELINE |
| 007 | [OML-T0006](./01-foundation.md#oml-t0006) | Local development infrastructure | BASELINE |
| 008 | [OML-T0101](./02-tenancy-identity.md#oml-t0101) | Organization aggregate | BASELINE |
| 009 | [OML-T0102](./02-tenancy-identity.md#oml-t0102) | Membership model | BASELINE |
| 010 | [OML-T0103](./02-tenancy-identity.md#oml-t0103) | Roles and permissions | BASELINE |
| 011 | [OML-T0104](./02-tenancy-identity.md#oml-t0104) | Scope bindings and service principals | BASELINE |
| 012 | [OML-T0105](./02-tenancy-identity.md#oml-t0105) | Tenant request context | BASELINE |
| 013 | [OML-T0106](./02-tenancy-identity.md#oml-t0106) | Authorization engine | BASELINE |
| 014 | [OML-T0107](./02-tenancy-identity.md#oml-t0107) | Tenant isolation and escalation tests | BASELINE |
| 015 | [OML-T0108](./02-tenancy-identity.md#oml-t0108) | Security-sensitive audit events | BASELINE |
| 016 | [OML-T0201](./03-conversation-core.md#oml-t0201) | Customer aggregate | BASELINE |
| 017 | [OML-T0202](./03-conversation-core.md#oml-t0202) | Customer identity mapping | BASELINE |
| 018 | [OML-T0203](./03-conversation-core.md#oml-t0203) | Conversation aggregate and control state | BASELINE |
| 019 | [OML-T0204](./03-conversation-core.md#oml-t0204) | Message model and delivery state | BASELINE |
| 020 | [OML-T0205](./03-conversation-core.md#oml-t0205) | Assignment and takeover transaction | BASELINE |
| 021 | [OML-T0206](./03-conversation-core.md#oml-t0206) | Message idempotency | BASELINE |
| 022 | [OML-T0207](./03-conversation-core.md#oml-t0207) | Transactional outbox for domain events | BASELINE |
| 023 | [OML-T0208](./03-conversation-core.md#oml-t0208) | Conversation core integration tests | BASELINE |
| 024 | [OML-T0301](./04-channels.md#oml-t0301) | Channel adapter contract | BASELINE |
| 025 | [OML-T0302](./04-channels.md#oml-t0302) | Web Widget tenant configuration | BASELINE |
| 026 | [OML-T0303](./04-channels.md#oml-t0303) | Widget public message ingress | BASELINE |
| 027 | [OML-T0304](./04-channels.md#oml-t0304) | Provider-event dedupe ledger | BASELINE |
| 028 | [OML-T0305](./04-channels.md#oml-t0305) | Retryable webhook ingress lease | BASELINE |
| 029 | [OML-T0306](./04-channels.md#oml-t0306) | Outbound delivery boundary | TARGET |
| 030 | [OML-T0307](./04-channels.md#oml-t0307) | WhatsApp provider adapter | TARGET |
| 031 | [OML-T0308](./04-channels.md#oml-t0308) | Channel adapter contract tests | BASELINE |
| 032 | [OML-T0401](./05-workforce-routing.md#oml-t0401) | Workforce member aggregate | BASELINE |
| 033 | [OML-T0402](./05-workforce-routing.md#oml-t0402) | Skills and proficiency | BASELINE |
| 034 | [OML-T0403](./05-workforce-routing.md#oml-t0403) | Presence with TTL | BASELINE |
| 035 | [OML-T0404](./05-workforce-routing.md#oml-t0404) | Agent capacity accounting | BASELINE |
| 036 | [OML-T0405](./05-workforce-routing.md#oml-t0405) | Teams and queues | BASELINE |
| 037 | [OML-T0406](./05-workforce-routing.md#oml-t0406) | Versioned routing policy | BASELINE |
| 038 | [OML-T0407](./05-workforce-routing.md#oml-t0407) | Deterministic routing evaluation | BASELINE |
| 039 | [OML-T0408](./05-workforce-routing.md#oml-t0408) | Routing decision and candidate snapshot | BASELINE |
| 040 | [OML-T0409](./05-workforce-routing.md#oml-t0409) | Transactional assignment commit | BASELINE |
| 041 | [OML-T0410](./05-workforce-routing.md#oml-t0410) | Escalation policy engine | TARGET |
| 042 | [OML-T0501](./06-event-runtime.md#oml-t0501) | PostgreSQL outbox publisher | BASELINE |
| 043 | [OML-T0502](./06-event-runtime.md#oml-t0502) | Per-consumer event inbox | BASELINE |
| 044 | [OML-T0503](./06-event-runtime.md#oml-t0503) | Leased work claiming | BASELINE |
| 045 | [OML-T0504](./06-event-runtime.md#oml-t0504) | Retry and dead-letter transitions | BASELINE |
| 046 | [OML-T0505](./06-event-runtime.md#oml-t0505) | Authorized dead-letter replay | BASELINE |
| 047 | [OML-T0506](./06-event-runtime.md#oml-t0506) | Worker-instance leases and heartbeats | BASELINE |
| 048 | [OML-T0507](./06-event-runtime.md#oml-t0507) | Per-class concurrency limits | BASELINE |
| 049 | [OML-T0508](./06-event-runtime.md#oml-t0508) | Production worker process entrypoint | BASELINE |
| 050 | [OML-T0509](./06-event-runtime.md#oml-t0509) | Asynchronous routing worker | BASELINE |
| 051 | [OML-T0510](./06-event-runtime.md#oml-t0510) | Event-runtime failure and recovery tests | BASELINE |
| 052 | [OML-T0601](./07-ai-platform.md#oml-t0601) | AI model registry | BASELINE |
| 053 | [OML-T0602](./07-ai-platform.md#oml-t0602) | Versioned model policy and deterministic failover | BASELINE |
| 054 | [OML-T0603](./07-ai-platform.md#oml-t0603) | AI agent identity and governance | BASELINE |
| 055 | [OML-T0604](./07-ai-platform.md#oml-t0604) | Agent execution policy | BASELINE |
| 056 | [OML-T0605](./07-ai-platform.md#oml-t0605) | AI input/output guardrails | BASELINE |
| 057 | [OML-T0606](./07-ai-platform.md#oml-t0606) | Durable AI run traceability and cost attribution | BASELINE |
| 058 | [OML-T0607](./07-ai-platform.md#oml-t0607) | AI evaluation kernel and regression evidence | BASELINE |
| 059 | [OML-T0608](./07-ai-platform.md#oml-t0608) | Authenticated AI APIs | BASELINE |
| 060 | [OML-T0609](./07-ai-platform.md#oml-t0609) | Governed context assembly | BASELINE |
| 061 | [OML-T0610](./07-ai-platform.md#oml-t0610) | Tool runtime authorization kernel | BASELINE |
| 062 | [OML-T0611](./07-ai-platform.md#oml-t0611) | Embedding provider registry | DEFERRED |
| 063 | [OML-T0612](./07-ai-platform.md#oml-t0612) | Advanced quality-based model routing | DEFERRED |
| 064 | [OML-T0613](./07-ai-platform.md#oml-t0613) | Multi-agent orchestration | DEFERRED |
| 065 | [OML-T0701](./08-workflows.md#oml-t0701) | Workflow definition and versioning | BASELINE |
| 066 | [OML-T0702](./08-workflows.md#oml-t0702) | Durable workflow run and step state | BASELINE |
| 067 | [OML-T0703](./08-workflows.md#oml-t0703) | Idempotent workflow triggers | BASELINE |
| 068 | [OML-T0704](./08-workflows.md#oml-t0704) | Workflow run leases and claiming | BASELINE |
| 069 | [OML-T0705](./08-workflows.md#oml-t0705) | Workflow retries and failure branches | BASELINE |
| 070 | [OML-T0706](./08-workflows.md#oml-t0706) | Durable WAIT and scheduler resume | BASELINE |
| 071 | [OML-T0707](./08-workflows.md#oml-t0707) | Durable approval state | BASELINE |
| 072 | [OML-T0708](./08-workflows.md#oml-t0708) | Workflow cancellation | BASELINE |
| 073 | [OML-T0709](./08-workflows.md#oml-t0709) | Workflow graph validation | BASELINE |
| 074 | [OML-T0710](./08-workflows.md#oml-t0710) | Workflow worker and scheduler integration | BASELINE |
| 075 | [OML-T0711](./08-workflows.md#oml-t0711) | Workflow side-effect and action steps | DEFERRED |
| 076 | [OML-T0712](./08-workflows.md#oml-t0712) | Workflow compensation execution | DEFERRED |
| 077 | [OML-T0713](./08-workflows.md#oml-t0713) | Workflow parallel fan-out and fan-in | DEFERRED |
| 078 | [OML-T0714](./08-workflows.md#oml-t0714) | Distributed cron triggers | DEFERRED |
| 079 | [OML-T0801](./09-quality.md#oml-t0801) | Versioned quality scorecards | BASELINE |
| 080 | [OML-T0802](./09-quality.md#oml-t0802) | Deterministic quality sampling | BASELINE |
| 081 | [OML-T0803](./09-quality.md#oml-t0803) | Quality evaluation state machine | BASELINE |
| 082 | [OML-T0804](./09-quality.md#oml-t0804) | Conversation-scoped evaluation evidence | BASELINE |
| 083 | [OML-T0805](./09-quality.md#oml-t0805) | Reproducible scoring calculation | BASELINE |
| 084 | [OML-T0806](./09-quality.md#oml-t0806) | AI proposal fencing | BASELINE |
| 085 | [OML-T0807](./09-quality.md#oml-t0807) | Finding-linked remediation workflow | BASELINE |
| 086 | [OML-T0808](./09-quality.md#oml-t0808) | Quality kernel parity and negative tests | BASELINE |
| 087 | [OML-T0809](./09-quality.md#oml-t0809) | Quality analytics and calibration | DEFERRED |
| 088 | [OML-T0901](./10-billing.md#oml-t0901) | Billing domain model | TARGET |
| 089 | [OML-T0902](./10-billing.md#oml-t0902) | Plan catalog and versioning | TARGET |
| 090 | [OML-T0903](./10-billing.md#oml-t0903) | Entitlement resolution engine | TARGET |
| 091 | [OML-T0904](./10-billing.md#oml-t0904) | Subscription state machine | TARGET |
| 092 | [OML-T0905](./10-billing.md#oml-t0905) | Immutable usage event model | TARGET |
| 093 | [OML-T0906](./10-billing.md#oml-t0906) | Usage aggregation and metering | TARGET |
| 094 | [OML-T0907](./10-billing.md#oml-t0907) | Payment provider abstraction | TARGET |
| 095 | [OML-T0908](./10-billing.md#oml-t0908) | Paymob payment creation | TARGET |
| 096 | [OML-T0909](./10-billing.md#oml-t0909) | Payment webhook ingestion | TARGET |
| 097 | [OML-T0910](./10-billing.md#oml-t0910) | Payment reconciliation | TARGET |
| 098 | [OML-T0911](./10-billing.md#oml-t0911) | Invoice and payment history | TARGET |
| 099 | [OML-T0912](./10-billing.md#oml-t0912) | Billing API and operator UI | TARGET |
| 100 | [OML-T0913](./10-billing.md#oml-t0913) | Billing observability and reconciliation metrics | TARGET |
| 101 | [OML-T0914](./10-billing.md#oml-t0914) | Billing end-to-end and failure tests | TARGET |
| 102 | [OML-T1001](./11-production-hardening.md#oml-t1001) | Security test plan and threat model refresh | TARGET |
| 103 | [OML-T1002](./11-production-hardening.md#oml-t1002) | Load and capacity tests | TARGET |
| 104 | [OML-T1003](./11-production-hardening.md#oml-t1003) | Backup and restore drill | TARGET |
| 105 | [OML-T1004](./11-production-hardening.md#oml-t1004) | Provider failover and recovery drill | TARGET |
| 106 | [OML-T1005](./11-production-hardening.md#oml-t1005) | Production observability dashboards | TARGET |
| 107 | [OML-T1006](./11-production-hardening.md#oml-t1006) | Incident response runbooks | TARGET |
| 108 | [OML-T1007](./11-production-hardening.md#oml-t1007) | Release gates and change management | TARGET |
| 109 | [OML-T1008](./11-production-hardening.md#oml-t1008) | Data retention and purge controls | TARGET |
| 110 | [OML-T1009](./11-production-hardening.md#oml-t1009) | Launch-readiness simulation | TARGET |

## Dependency spine

```mermaid
flowchart LR
F[Foundation] --> T[Tenancy + Identity]
T --> C[Customer + Conversation]
C --> W[Workforce + Routing]
C --> E[Event + Worker Runtime]
C --> CH[Channels]
CH --> AI[AI Platform]
AI --> WF[Workflows]
WF --> Q[Quality]
Q --> B[Billing]
B --> H[Production Hardening]
```

Treat this directory as the source of truth for the development queue. Documentation does not prove implementation.