# OmniLinks Domain Model

## Purpose

This document defines the business objects and bounded contexts that the implementation must preserve.

## Bounded contexts

| Context | Responsibility |
|---|---|
| Tenancy | organization lifecycle and tenant ownership |
| Identity | human identity and authentication references |
| Access | memberships, roles, permissions and scope |
| Commercial | client accounts and operational programs |
| Workforce | human/AI workers, teams, queues, assignments |
| Customer | customers and cross-channel identity |
| Conversation | conversations, messages, notes and state |
| Channel | provider connections and message translation |
| Knowledge | documents, sources, versions and retrieval policy |
| AI | agents, model routing, runs and evaluation |
| Action | tools, approvals and execution |
| Workflow | deterministic automation |
| Quality | QA and SLA evaluation |
| Analytics | derived metrics and reporting |
| Billing | plans, entitlements, subscriptions and usage |
| Integration | external systems and credentials |
| Audit | security/business evidence |
| Notification | user/tenant notifications |

## Canonical hierarchy

    OmniLinks Platform
        Tenant
            Client Account (optional for direct operators)
                Program
                    Sector
                        Team
                            Workforce

A direct enterprise may use Tenant -> Sector -> Team.

A BPO/service provider uses Tenant -> Client Account -> Program -> Sector -> Team.

## Core entities

Organization
- contracting organization
- security boundary
- operating mode
- locale, timezone and currency

User
- human identity
- no global tenant role

Membership
- connects User to Organization
- carries tenant-scoped roles

Role
- permission bundle

Permission
- atomic authorization capability

ClientAccount
- business served by a service provider

Program
- operational engagement for a client

Sector
- functional work area such as support, sales, quality or collections

Team
- execution unit inside a sector

WorkforceMember
- normalized operational worker reference
- points to human or AI worker configuration

Customer
- channel-independent external person

ChannelIdentity
- external identity on WhatsApp, Instagram, Telegram, SMS, web or another channel

Conversation
- unified operational interaction

Message
- normalized inbound/outbound communication

ChannelConnection
- tenant-owned provider connection

AIAgent
- governed AI worker configuration

AIRun
- one AI execution

KnowledgeBase
- permissioned knowledge boundary

Action
- business operation callable by human, AI or workflow

ActionExecution
- one execution attempt/result

ApprovalRequest
- authorization step for designated high-risk actions

Workflow
- versioned automation definition

WorkflowRun
- one execution of a workflow version

QualityReview
- human or automated quality assessment

UsageRecord
- immutable usage measurement

AuditEvent
- security/business evidence

## Relationship rules

1. Every tenant-owned resource has a deterministic ownership path to exactly one Organization.
2. A User may have multiple Memberships.
3. A Membership belongs to one Organization.
4. A ClientAccount belongs to one Organization.
5. A Program belongs to one ClientAccount.
6. A Sector belongs either to a Program or to the tenant according to the explicit sector scope.
7. A Team belongs to one Sector.
8. A Customer belongs to one Organization.
9. A Customer may own many ChannelIdentities.
10. A Conversation belongs to one Customer and one Organization.
11. A Conversation may be served by one ChannelConnection at a time, while its history can contain messages from multiple channel connections where the product explicitly supports cross-channel continuity.
12. An AIAgent belongs to one Organization.
13. An AIAgent can access only explicitly bound knowledge and actions.
14. An ActionExecution always records its acting principal and authorization context.
15. Published Workflow and Prompt versions are immutable.
16. Usage records are append-only facts.
17. Audit events are append-only from application workflows.

## State machines

Conversation:
open -> assigned -> active -> waiting -> resolved -> closed
active -> escalated -> assigned
resolved -> reopened only through an explicit command

Subscription:
trialing -> active
active -> past_due
past_due -> active
past_due -> suspended
suspended -> active
active -> canceled

Approval:
requested -> approved -> executed
requested -> rejected
requested -> expired

## Invariants that require automated tests

- cross-tenant resource access is impossible
- team-scoped access cannot cross teams
- channel identity cannot silently merge low-confidence matches
- action execution cannot bypass authorization
- high-risk action cannot bypass approval
- duplicate inbound events do not duplicate messages
- duplicate usage events do not duplicate billable quantity
- an old workflow/prompt version remains reproducible after publication
