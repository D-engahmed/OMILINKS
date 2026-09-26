# OmniLinks Product Requirements Document

Status: Baseline v2
Date: 2026-09-26

## 1. Product

OmniLinks is a multi-tenant Customer Operations Platform. It unifies customer conversations, human workforce, AI workforce, knowledge, business actions, workflows, integrations, quality, analytics and billing.

The product is not a chatbot. The core unit is a customer outcome moving through an operational process.

## 2. Operating models

Direct operator:

    Tenant
      -> sectors
      -> teams
      -> human + AI workforce
      -> customers

Service provider/BPO:

    Tenant
      -> client accounts
      -> programs
      -> sectors
      -> teams
      -> workforce
      -> customer operations

The same platform supports both modes.

## 3. Target market

Egypt-first, with phased MENA expansion.

The product must treat Arabic, English and Arabic/English code switching as first-class concerns, alongside local timezone, currency and regional channel/payment requirements.

## 4. Problem

Customer work is fragmented across channel-specific inboxes and disconnected operational tools.

This produces:
- duplicated customer context
- slow response
- inconsistent answers
- expensive repetitive work
- weak supervision and quality visibility
- unsafe or disconnected AI actions
- fragmented usage and cost measurement

Market statistics are not product facts until sourced or validated.

## 5. Goals

G1. One customer record across supported channels.

G2. One conversation model independent of provider.

G3. AI responses grounded in authorized business knowledge.

G4. Human and AI workforce can share assignment, routing, context, escalation, quality and audit concepts.

G5. Business actions are permissioned and approval-aware.

G6. Service-provider tenants can operate multiple clients and programs.

G7. Backend-enforced entitlements and usage accounting.

G8. Operational, workforce, AI and financial analytics.

G9. Reliable integrations with channel and business providers.

G10. Hard tenant isolation.

## 6. Non-goals for V1

- full CRM replacement
- full ERP
- payroll/HRIS
- carrier-grade telephony
- bulk marketing platform
- proprietary foundation model
- general-purpose BPM product
- arbitrary data lake

## 7. Users

Platform operator:
Internal OmniLinks operations.

Tenant owner:
Organization administration and commercial control.

Operations manager:
Programs, queues, workforce, SLA and performance.

Supervisor:
Live work, escalations and team quality.

Human agent:
Customer conversations, knowledge and authorized actions.

AI agent:
Governed automated worker.

Developer/integration user:
APIs, webhooks and external connections.

Customer:
External person interacting through a channel.

## 8. Product workspaces

Tenant Administration
- organization
- users
- permissions
- clients
- programs
- sectors
- teams
- channels
- integrations
- billing

Support Operations
- inbox
- queues
- customers
- conversations
- assignment
- escalation

AI Operations
- AI agents
- models
- knowledge
- tools
- runs
- evaluation
- cost

Quality/Workforce/Other Sector Workspaces
Added when their workflows become distinct enough to justify separate application surfaces.

Customer Experience
- widget
- embed
- channel experiences

## 9. Functional requirements

FR-001 Tenant isolation
All protected operations require a server-resolved organization context.

FR-002 Scoped authorization
Authorization may depend on tenant, client, program, sector, team and resource.

FR-003 Customer continuity
Customers can own multiple channel identities.

FR-004 Human takeover
A human can take over an AI-handled conversation with complete operational context.

FR-005 Knowledge grounding
RAG retrieval is permission-aware.

FR-006 Action governance
AI cannot execute unauthorized actions. High-risk actions may require approval.

FR-007 Idempotency
Repeated inbound events and retried commands cannot duplicate business side effects.

FR-008 Audit
Security-sensitive mutations produce audit evidence.

FR-009 Billing authority
Usage and entitlement decisions are made on the backend.

FR-010 Localization
Support RTL/LTR, locale, timezone and currency.

## 10. Core lifecycle

    channel event
      -> identity resolution
      -> customer
      -> conversation
      -> automation/routing
      -> AI or human
      -> action if permitted
      -> response
      -> resolution/escalation
      -> usage + audit + analytics

## 11. Success measures

Track per tenant/program where useful:
- first response time
- resolution time
- SLA compliance
- AI containment
- escalation rate
- human takeover
- channel delivery
- AI latency
- AI cost
- action success/failure
- knowledge retrieval success
- quality score

Targets must be based on observed baselines and commercial requirements, not invented before launch.

## 12. V1 release definition

V1 requires one dependable vertical customer-operations loop, then expands:

    tenant
      -> team
      -> channel
      -> customer
      -> conversation
      -> human/AI
      -> resolution
      -> usage
      -> analytics

A large channel list without operational reliability does not constitute product completeness.

## 13. Acceptance criteria

Production readiness requires:
- cross-tenant tests passing
- server authorization on every protected operation
- webhook signature verification
- idempotent inbound/outbound handling
- explicit provider failure behavior
- tool/action authorization
- sensitive-log redaction
- usage reconciliation
- migration/recovery procedures
- CI quality gates
- operational monitoring
