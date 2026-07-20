# Omnilinks — Software Requirements Specification (SRS)

**Version:** 1.0  
**Date:** July 2026  
**Status:** Draft  
**Author:** Architecture & Product Team  
**Based on:** BRD v1.1, PRD v1.0, SAD v0.1.0

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Compliance & Regulatory Requirements](#8-compliance--regulatory-requirements)
9. [Appendices](#9-appendices)

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for **Omnilinks**, a multi-tenant SaaS platform that unifies WhatsApp, Telegram, Instagram, Facebook Messenger, SMS, and VoIP into a single AI-powered inbox. This document serves as the authoritative technical reference for engineering implementation, QA validation, and stakeholder alignment.

### 1.2 Document Conventions

| Convention | Meaning |
|---|---|
| **SHALL** | Mandatory requirement — must be implemented |
| **SHOULD** | Recommended requirement — implement unless justified otherwise |
| **MAY** | Optional requirement — implement if resources permit |
| **P0** | Critical priority — MVP launch blocker |
| **P1** | High priority — required for General Availability |
| **P2** | Medium priority — post-launch enhancement |
| **TBD** | To be determined — decision pending |

### 1.3 Intended Audience

- Engineering leads and developers
- QA engineers and test automation
- DevOps and infrastructure teams
- Security and compliance officers
- Product managers

### 1.4 Project Scope

Omnilinks SHALL provide:
- Unified multi-channel inbox (6 channels)
- Multi-LLM AI reply engine with RAG knowledge base
- Usage-based billing via Paymob (Egypt/UAE/Saudi)
- Real-time BI analytics
- Multi-tenant architecture with row-level security
- Role-based access control (RBAC) with 6 default role templates

**In-scope:** MVP features per BRD Chapter 07  
**Out-of-scope:** Native mobile app, custom CRM integrations, email channel, live chat widget, on-premise deployment, advanced workflow automation (V2)

### 1.5 References

| Document | Version | Description |
|---|---|---|
| BRD | 1.1 | Business Requirements Document |
| PRD | 1.0 | Product Requirements Document |
| SAD | 0.1.0 | Software Architecture Document |
| Actor Map | — | System actor definitions |

---

## 2. Overall Description

### 2.1 Product Perspective

Omnilinks is a greenfield multi-tenant SaaS backend with a Next.js frontend. It operates as a standalone system that integrates with external channel platforms, LLM providers, and payment gateways.

```
┌─────────────────────────────────────────────────────────────────┐
│                         OMNILINKS PLATFORM                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Next.js    │  │  FastAPI    │  │    Data Layer           │  │
│  │  Frontend   │◄─┤  Backend    │◄─┤  PostgreSQL / Redis /   │  │
│  │  (React 19) │  │  (Python)   │  │  Qdrant                 │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
│                          │                                      │
│  External: WhatsApp · Telegram · Instagram · FB · SMS · VoIP    │
│  External: OpenAI · Anthropic · Gemini · Local Gemma 4          │
│  External: Paymob (Egypt/UAE/Saudi)                             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Functions

| ID | Function | Priority |
|---|---|---|
| F-01 | Receive and normalize messages from 6 channels | P0 |
| F-02 | AI-powered intent detection and auto-reply | P0 |
| F-03 | RAG knowledge base retrieval and grounding | P0 |
| F-04 | Human escalation and agent workspace | P0 |
| F-05 | Multi-LLM routing with fallback | P0 |
| F-06 | Usage-based billing and metering | P0 |
| F-07 | Real-time BI analytics dashboards | P1 |
| F-08 | Tenant provisioning and team management | P0 |
| F-09 | Role-based access control | P0 |
| F-10 | Row-level security and tenant isolation | P0 |

### 2.3 User Classes and Characteristics

#### 2.3.1 Platform Plane (Omnilinks Staff)

| Actor | Description | Count |
|---|---|---|
| Platform Owner | Full platform control | 1–2 |
| Platform Admin | Tenant management, billing overrides | 2–3 |
| System Operator | Infrastructure operations, cross-tenant | 2–4 |
| Support Engineer | Tenant-facing support, break-glass access | 2–4 |

#### 2.3.2 Tenant Plane (Customer Employees)

| Actor | Description | Typical Count per Tenant |
|---|---|---|
| Tenant Admin | Tenant-wide configuration and billing | 1–3 |
| Team Admin | Single-team configuration | 1 per team |
| Manager | Cross-team or single-team operations | 1–5 |
| Supervisor | Live operations, escalation approval | 1–3 per team |
| Human Agent | Frontline conversation handling | 5–25 |
| Analyst | Read-only analytics and reporting | 1–3 |

#### 2.3.3 Customer Plane (End Users)

| Actor | Description |
|---|---|
| Contact | End customer messaging via channels — never authenticates |

### 2.4 Operating Environment

| Component | Technology | Version |
|---|---|---|
| Frontend | Next.js | 15+ (React 19) |
| Frontend State | Zustand | Latest |
| Styling | Tailwind CSS | 3.x+ |
| API Framework | FastAPI | 0.110+ |
| Python | CPython | 3.12+ |
| ORM | SQLAlchemy | 2.0 (async) |
| Database Driver | asyncpg | Latest |
| Cache/Queue | Redis | 7.x |
| Vector Store | Qdrant | 1.x |
| Primary Database | PostgreSQL | 15+ |

### 2.5 Design and Implementation Constraints

**C-01:** The system SHALL use async Python throughout the backend (FastAPI + SQLAlchemy 2.0 async + asyncpg).  
**C-02:** The system SHALL enforce tenant isolation via PostgreSQL Row-Level Security (RLS), not just application-layer filtering.  
**C-03:** The system SHALL use JWT tokens with Redis-backed blacklists for authentication.  
**C-04:** The system SHALL support 768-dimensional embeddings for Qdrant vector storage.  
**C-05:** The system SHALL implement a pluggable provider pattern for both LLMs and payment processors.  
**C-06:** The system SHALL NOT handle raw card data — payment processing SHALL be delegated to Paymob's hosted checkout/tokenization (SAQ-A scope).

### 2.6 Assumptions and Dependencies

**A-01:** Paymob's hosted checkout/tokenization mode is confirmed (PCI-DSS SAQ-A scope).  
**A-02:** Egypt is the confirmed launch market; UAE, Saudi Arabia, Qatar, and Morocco are phased expansions.  
**A-03:** WhatsApp Business API, Telegram Bot API, Instagram Graph API, and Facebook Messenger API remain available at commercial terms.  
**A-04:** At least one LLM provider (OpenAI, Anthropic, or Gemini) maintains API availability at launch.  
**A-05:** A cloud provider (AWS, GCP, or Azure) is selected before deployment.

---

## 3. System Features & Functional Requirements

### 3.1 Feature: ### 
 [Multi-Channel Message Ingestion](System_Features_&_Functional_Requirements/Multi-Channel_Message_Ingestion.md)

#### 3.1.1 Description
The system SHALL receive incoming messages from six communication channels, normalize them to a unified event format, and persist them for processing.

#### 3.1.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-ING-01** | The system SHALL support inbound webhooks from WhatsApp Business API. | P0 |
| **F-ING-02** | The system SHALL support inbound webhooks from Telegram Bot API. | P0 |
| **F-ING-03** | The system SHALL support inbound webhooks from Instagram Graph API. | P0 |
| **F-ING-04** | The system SHALL support inbound webhooks from Facebook Messenger. | P0 |
| **F-ING-05** | The system SHALL support inbound messages from SMS gateway (webhook or SMPP). | P0 |
| **F-ING-06** | The system SHALL support inbound calls/messages from VoIP/SIP trunk (webhook or WebSocket). | P0 |
| **F-ING-07** | The system SHALL verify HMAC-SHA256 signatures on all inbound webhooks before processing. | P0 |
| **F-ING-08** | The system SHALL reject webhooks with invalid signatures, log a security event, and return HTTP 401. | P0 |
| **F-ING-09** | The system SHALL normalize all inbound messages to a `UnifiedEvent` schema containing: channel_type, channel_id, external_message_id, sender_identity, message_type, content, timestamp, metadata. | P0 |
| **F-ING-10** | The system SHALL perform idempotency checks using Redis deduplication keys (channel_id + external_message_id) with a 24-hour TTL. | P0 |
| **F-ING-11** | The system SHALL persist raw webhook payloads to PostgreSQL before normalization. | P0 |
| **F-ING-12** | The system SHALL apply rate limiting per channel per tenant (configurable, default 100 msgs/min). | P0 |
| **F-ING-13** | The system SHALL reject messages from suspended channels with HTTP 403. | P0 |

#### 3.1.3 Stimulus/Response Sequences

**Stimulus:** Customer sends WhatsApp message → WhatsApp Cloud API delivers webhook  
**Response:**
1. WAF/DDoS check passes
2. Rate limit check passes
3. HMAC-SHA256 signature verified
4. Channel config lookup (tenant_id, webhook_secret, status=ACTIVE)
5. Raw payload persisted
6. Normalized to UnifiedEvent
7. Idempotency check (Redis)
8. Forwarded to Conversation Domain

### 3.2 Feature: AI Decision Engine

#### 3.2.1 Description
[The system SHALL classify incoming messages, retrieve relevant context, generate AI-powered responses, and route them based on confidence scores and policy authorization.](System_Features_&_Functional_Requirements/AI_Decision_Engine.md)

#### 3.2.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-AI-01** | The system SHALL perform input guardrail checks on every message: spam detection, prompt injection detection, jailbreak detection, malware scan. | P0 |
| **F-AI-02** | The system SHALL block messages that fail input guardrails and log the event. | P0 |
| **F-AI-03** | The system SHALL resolve the sender to a `Contact` entity and link to `CustomerIdentity` for cross-channel continuity. | P0 |
| **F-AI-04** | The system SHALL retrieve cross-channel conversation history via `History Retrieval Service` (RAG Domain), ordered by recency. | P0 |
| **F-AI-05** | The system SHALL detect intent and extract entities from the normalized message. | P0 |
| **F-AI-06** | The system SHALL retrieve same-conversation short-term memory from Redis (session-scoped, TTL-bound). | P0 |
| **F-AI-07** | The system SHALL perform semantic search against the tenant's knowledge base via Qdrant (top_k=5, per-tenant filtered). | P0 |
| **F-AI-08** | The system SHALL execute external tools (CRM, ERP, billing API) when the execution plan requires them. | P1 |
| **F-AI-09** | The system SHALL route LLM calls through a `Model Router` supporting: OpenAI GPT-4, Anthropic Claude, Google Gemini, and local Gemma 4. | P0 |
| **F-AI-10** | The system SHALL implement circuit breaker pattern for LLM provider failover: primary → fallback → human escalation. | P0 |
| **F-AI-11** | The system SHALL generate candidate responses informed by: cross-channel history, same-conversation memory, RAG chunks, and tool results. | P0 |
| **F-AI-12** | The system SHALL apply output guardrails: hallucination detection, PII redaction, toxicity filtering, compliance check, legal risk assessment. | P0 |
| **F-AI-13** | The system SHALL calculate a confidence score (0–100) for every candidate response. | P0 |
| **F-AI-14** | The system SHALL apply a `Policy/Authorization Engine` gate: a high-confidence response MAY still require human approval based on tenant policy (e.g., refund thresholds). | P0 |
| **F-AI-15** | The system SHALL route responses as follows: ≥80% confidence + authorized → auto-reply; 40–80% confidence → human review queue; <40% confidence → human handoff. | P0 |
| **F-AI-16** | The system SHALL generate a `ConversationSummary` at conversation close, stored in PostgreSQL, keyed to `CustomerIdentity`. | P1 |

#### 3.2.3 Confidence Routing Logic

```
IF confidence >= 80% AND policy_authorized:
    → Auto-reply (counts toward OBJ-05 Auto-Resolution)
ELIF 40% <= confidence < 80% OR not policy_authorized:
    → Human review queue (AI draft attached)
ELIF confidence < 40%:
    → Human handoff (no AI draft)
```

### 3.3 Feature: RAG Knowledge Base

#### 3.3.1 Description
[The system SHALL allow tenants to ingest documents, chunk them, generate embeddings, and retrieve relevant context for AI responses.](System_Features_&_Functional_Requirements/RAG_Knowledge_Base.md)

#### 3.3.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-RAG-01** | The system SHALL support document ingestion: PDF, DOCX, TXT, Markdown. | P0 |
| **F-RAG-02** | The system SHALL chunk documents into configurable segment sizes (default: 512 tokens, 128 overlap). | P0 |
| **F-RAG-03** | The system SHALL generate 768-dimensional embeddings using the configured embedding model. | P0 |
| **F-RAG-04** | The system SHALL store embeddings in Qdrant with per-tenant collection isolation. | P0 |
| **F-RAG-05** | The system SHALL perform semantic search with cosine similarity, returning top_k=5 chunks. | P0 |
| **F-RAG-06** | The system SHALL filter vector search results by tenant_id (collection-level isolation). | P0 |
| **F-RAG-07** | The system SHALL support knowledge base management per team (team-scoped KBs). | P0 |
| **F-RAG-08** | The system SHALL allow Team Admin to upload, replace, and delete KB documents. | P0 |
| **F-RAG-09** | The system SHALL track KB document versioning and usage statistics. | P1 |

### 3.4 Feature: Human Escalation & Agent Workspace

#### 3.4.1 Description
[The system SHALL route escalated conversations to human agents, provide a workspace for handling conversations, and support supervisor approval workflows.](System_Features_&_Functional_Requirements/Agent_Workspace.md)

#### 3.4.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-AGENT-01** | The system SHALL assign escalated conversations to available Human Agents based on team membership and load balancing. | P0 |
| **F-AGENT-02** | The system SHALL enforce `max_concurrent_conversations` per agent (configurable per team membership). | P0 |
| **F-AGENT-03** | The system SHALL provide a unified inbox UI showing: conversation list, message thread, customer timeline (cross-channel history), AI suggestions, KB search. | P0 |
| **F-AGENT-04** | The system SHALL allow Human Agents to: reply, create internal notes, search KB, use canned responses, assign/transfer conversations, close conversations. | P0 |
| **F-AGENT-05** | The system SHALL display AI-generated draft responses in the review queue for agents to approve, edit, or reject. | P0 |
| **F-AGENT-06** | The system SHALL allow Supervisors to: monitor live queues, approve policy exceptions, takeover conversations, coach agents. | P0 |
| **F-AGENT-07** | The system SHALL start an interruptible SLA timer on escalation and alert Supervisor + reassign on breach. | P0 |
| **F-AGENT-08** | The system SHALL support canned responses (team-scoped, with usage tracking). | P1 |
| **F-AGENT-09** | The system SHALL allow Agents to create tickets linked to conversations. | P1 |
| **F-AGENT-10** | The system SHALL display `CustomerIdentity` timeline (last N `ConversationSummary` rows across all channels) in the agent dashboard. | P1 |

### 3.5 Feature: Multi-LLM Provider Routing

#### 3.5.1 Description
[The system SHALL abstract LLM provider interactions behind a unified interface, support multiple providers, and implement failover.](System_Features_&_Functional_Requirements/Multi-Channel_Message_Ingestion.md)

#### 3.5.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-LLM-01** | The system SHALL define an `AbstractLLMProvider` interface with methods: `generate_reply(prompt, context)`, `get_model_name()`. | P0 |
| **F-LLM-02** | The system SHALL implement concrete providers: OpenAIProvider, AnthropicProvider, GeminiProvider, OpenSourceProvider (local Gemma 4). | P0 |
| **F-LLM-03** | The system SHALL route requests to the primary provider by default. | P0 |
| **F-LLM-04** | The system SHALL implement circuit breaker: after N consecutive failures within T seconds, switch to fallback provider. | P0 |
| **F-LLM-05** | The system SHALL support provider-specific configuration per tenant (API keys, model selection, temperature, max_tokens). | P0 |
| **F-LLM-06** | The system SHALL track per-provider usage: request count, token consumption, latency, cost. | P0 |
| **F-LLM-07** | The system SHALL allow tenant-level model preference configuration (Team Admin scope). | P1 |

### 3.6 Feature: Usage-Based Billing

#### 3.6.1 Description
[The system SHALL meter resource consumption, calculate charges against plan allocations, and process payments via Paymob.](System_Features_&_Functional_Requirements/Usage-Based_Billing.md)

#### 3.6.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-BILL-01** | The system SHALL track usage per tenant: AI Credits consumed, messages sent, active seats, connected channels, KB documents. | P0 |
| **F-BILL-02** | The system SHALL define plan tiers with hard limits: SMB ($65/mo: 5 seats, 3 channels, 10K messages, 2.5K AI Credits, 5 KBs); Mid-Market ($500/mo: 25 seats, 6 channels, 100K messages, 25K AI Credits, 25 KBs); Enterprise (custom). | P0 |
| **F-BILL-03** | The system SHALL calculate overage charges when usage exceeds plan allocation per BRD Chapter 09 rates. | P0 |
| **F-BILL-04** | The system SHALL process subscription charges via Paymob tokenized merchant-initiated charges. | P0 |
| **F-BILL-05** | The system SHALL process overage charges as separate tokenized merchant-initiated charges. | P0 |
| **F-BILL-06** | The system SHALL support 14-day free trials with full SMB-tier access. | P0 |
| **F-BILL-07** | The system SHALL send payment failure notifications to Tenant Admin and apply grace period logic. | P0 |
| **F-BILL-08** | The system SHALL emit revenue events to the Analytics Domain on every successful charge. | P0 |
| **F-BILL-09** | The system SHALL provide a tenant-facing usage dashboard showing current consumption vs. plan limits. | P1 |
| **F-BILL-10** | The system SHALL support annual billing with 15–20% discount (exact percentage TBD). | P1 |

### 3.7 Feature: BI Analytics

#### 3.7.1 Description
[The system SHALL collect, aggregate, and present business intelligence metrics for tenant operations and platform health.](System_Features_&_Functional_Requirements/BI_Analytics.md)

#### 3.7.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-ANALYTICS-01** | The system SHALL track and display: MRR, active tenants, churn rate, NRR. | P1 |
| **F-ANALYTICS-02** | The system SHALL track and display per-tenant: conversation volume, response times, AI auto-resolution rate, agent performance, CSAT/NPS. | P1 |
| **F-ANALYTICS-03** | The system SHALL track channel analytics: volume per channel, delivery success/failure rates. | P1 |
| **F-ANALYTICS-04** | The system SHALL support real-time dashboard updates via SSE. | P1 |
| **F-ANALYTICS-05** | The system SHALL allow Analyst role to export reports (CSV/Excel). | P1 |
| **F-ANALYTICS-06** | The system SHALL emit BI events for: message received, AI reply sent, human reply sent, escalation, conversation closed, charge succeeded/failed. | P1 |

### 3.8 Feature: Tenant & Team Management

#### 3.8.1 Description
[The system SHALL support multi-tenant provisioning, team hierarchy, user management, and role-based access control.](System_Features_&_Functional_Requirements/Tenant_&_Team_Management.md)

#### 3.8.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-TENANT-01** | The system SHALL support tenant types: INDIVIDUAL, STARTUP, SMALL_BUSINESS, MEDIUM_BUSINESS, ENTERPRISE, NONPROFIT, GOVERNMENT, EDUCATION. | P0 |
| **F-TENANT-02** | The system SHALL auto-create a default team named "General" on tenant provisioning. | P0 |
| **F-TENANT-03** | The system SHALL enforce: every tenant has at least one team; the last team cannot be deleted. | P0 |
| **F-TENANT-04** | The system SHALL enforce: every team has at least one member with `team.manage` permission; the last such member cannot be removed or demoted. | P0 |
| **F-TENANT-05** | The system SHALL allow a user to belong to multiple teams with different roles per team. | P0 |
| **F-TENANT-06** | The system SHALL support six default role templates: Tenant Admin, Team Admin, Manager, Supervisor, Human Agent, Analyst. | P0 |
| **F-TENANT-07** | The system SHALL implement permission-based RBAC: authorization checks test permissions, never role names. | P0 |
| **F-TENANT-08** | The system SHALL resolve effective permissions as the union of: tenant-scope role assignments + all team-scope role assignments. | P0 |
| **F-TENANT-09** | The system SHALL cache resolved permissions in Redis (TTL 5 minutes) with instant invalidation on role/membership changes. | P0 |
| **F-TENANT-10** | The system SHALL support custom roles for Enterprise tenants (P1 feature, permission reserved in MVP). | P1 |
| **F-TENANT-11** | The system SHALL define a billable seat as any active user holding `conversation.reply` permission in any team. | P0 |

#### 3.8.3 Role Permission Matrix

| Permission | Tenant Admin | Team Admin | Manager | Supervisor | Agent | Analyst |
|---|---|---|---|---|---|---|
| `tenant.manage` | ✅ | — | — | — | — | — |
| `billing.manage` | ✅ | — | — | — | — | — |
| `team.create` | ✅ | ✅ | ✅ | — | — | — |
| `team.update.team` | ✅ | ✅ | — | — | — | — |
| `team.members.manage.team` | ✅ | ✅ | ✅ | — | — | — |
| `user.invite` | ✅ | ✅ | ✅ | — | — | — |
| `conversation.view.team` | ✅ | ✅ | ✅ | ✅ | ✅ (assigned) | ✅ (read-only) |
| `conversation.reply` | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| `conversation.assign.team` | ✅ | ✅ | ✅ | ✅ | — | — |
| `conversation.takeover` | ✅ | — | — | ✅ | — | — |
| `ai.reply.approve` | ✅ | ✅ | ✅ | ✅ | — | — |
| `ai.configure.team` | ✅ | ✅ | — | — | — | — |
| `kb.manage.team` | ✅ | ✅ | — | — | — | — |
| `analytics.view.all` | ✅ | — | — | — | — | ✅ |
| `analytics.export` | ✅ | ✅ | — | — | — | ✅ |

### 3.9 Feature: Security & Tenant Isolation

#### 3.9.1 Description
[The system SHALL enforce authentication, authorization, data encryption, and tenant isolation.](System_Features_&_Functional_Requirements/Security_&_Tenant_Isolation.md)

#### 3.9.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-SEC-01** | The system SHALL use JWT access tokens (short-lived) + refresh tokens for authentication. | P0 |
| **F-SEC-02** | The system SHALL maintain a Redis token blacklist for revoked tokens. | P0 |
| **F-SEC-03** | The system SHALL enforce mandatory MFA for all Platform Users. | P0 |
| **F-SEC-04** | The system SHALL support SSO/SAML for Enterprise tenants (P1). | P1 |
| **F-SEC-05** | The system SHALL implement PostgreSQL RLS policies: `WHERE tenant_id = current_setting('app.tenant_id')` on all tenant-scoped tables. | P0 |
| **F-SEC-06** | The system SHALL set `tenant_id` via ContextVar on every request and pass it to PostgreSQL via `SET app.tenant_id`. | P0 |
| **F-SEC-07** | The system SHALL encrypt data at rest using AES-256-GCM via cloud-provider KMS envelope encryption. | P0 |
| **F-SEC-08** | The system SHALL encrypt all data in transit using TLS 1.3. | P0 |
| **F-SEC-09** | The system SHALL implement rate limiting: per-IP, per-user, per-tenant tiers. | P0 |
| **F-SEC-10** | The system SHALL log all authentication attempts, permission checks, and data mutations to an immutable audit log. | P0 |
| **F-SEC-11** | The system SHALL support break-glass platform access with time-boxed grants, reason codes, and tenant-visible audit entries. | P0 |
| **F-SEC-12** | The system SHALL implement input validation and sanitization on all API endpoints using Pydantic schemas. | P0 |

### 3.10 Feature: Channel Adapter & Outbound Delivery

#### 3.10.1 Description
[The system SHALL format and deliver responses back to customers via the original channel.](System_Features_&_Functional_Requirements/Channel_Adapter_&_Outbound_Delivery.md)

#### 3.10.2 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| **F-OUT-01** | The system SHALL format outbound messages per channel specification (WhatsApp message templates, Telegram Markdown, etc.). | P0 |
| **F-OUT-02** | The system SHALL apply per-channel rate limiting (sliding window, configurable per tenant). | P0 |
| **F-OUT-03** | The system SHALL queue outbound messages when rate limits are exceeded, with exponential backoff retry (max 3 attempts). | P0 |
| **F-OUT-04** | The system SHALL mark messages as failed after 3 retry attempts and compensate usage (refund AI Credit). | P0 |
| **F-OUT-05** | The system SHALL track delivery status: queued, sent, delivered, read, failed. | P0 |
| **F-OUT-06** | The system SHALL handle channel API errors gracefully and escalate to human on persistent failure. | P0 |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Next.js Frontend
- **Tenant Dashboard:** Conversation inbox, agent workspace, analytics, configuration
- **Platform Console:** Tenant provisioning, infrastructure monitoring, cross-tenant audit logs
- **Responsive Design:** Desktop-first, tablet-compatible (mobile app is V2/out-of-scope)

#### 4.1.2 Real-Time Updates
- Server-Sent Events (SSE) for live conversation updates, queue changes, and analytics

### 4.2 Hardware Interfaces

Not applicable — cloud-hosted SaaS.

### 4.3 Software Interfaces

#### 4.3.1 Channel Platform APIs

| Platform | API Type | Authentication | Webhook Verification |
|---|---|---|---|
| WhatsApp | Cloud API REST + Webhooks | Bearer token | HMAC-SHA256 |
| Telegram | Bot API REST + Webhooks | Bot token | HMAC-SHA256 (optional) |
| Instagram | Graph API REST + Webhooks | App token | HMAC-SHA256 |
| Facebook Messenger | Graph API REST + Webhooks | App token | HMAC-SHA256 |
| SMS | REST API + Webhooks | API key | HMAC-SHA256 |
| VoIP | SIP + WebSocket | SIP credentials | N/A |

#### 4.3.2 LLM Provider APIs

| Provider | API | Authentication |
|---|---|---|
| OpenAI | REST (chat.completions) | API key |
| Anthropic | REST (messages) | API key |
| Google Gemini | REST (generateContent) | API key |
| Local Gemma 4 | HTTP (self-hosted) | None (local) |

#### 4.3.3 Payment Provider API

| Provider | API | Authentication |
|---|---|---|
| Paymob | REST (tokenized charges) | API key + HMAC |

### 4.4 Communications Interfaces

| Protocol | Usage |
|---|---|
| HTTPS/TLS 1.3 | All external API calls, frontend-backend communication |
| WebSocket | VoIP signaling, real-time voice (future) |
| SSE | Real-time frontend updates |
| gRPC | Qdrant vector search |
| Redis Protocol | Cache, queue, token blacklist |
| PostgreSQL Wire | Primary database |

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| ID | Requirement | Target | Measurement |
|---|---|---|---|
| **N-PERF-01** | AI first response time | < 5 seconds (median) | BRD OBJ-07 |
| **N-PERF-02** | Platform availability | 99.9% uptime | BRD OBJ-06 |
| **N-PERF-03** | API response time (p95) | < 200ms for CRUD operations | Internal |
| **N-PERF-04** | Webhook ingestion throughput | 1,000 messages/minute per tenant | Internal |
| **N-PERF-05** | Vector search latency | < 100ms (p95) | Internal |
| **N-PERF-06** | Concurrent agent sessions | 500 per tenant | Internal |
| **N-PERF-07** | Database query time (p95) | < 50ms | Internal |

### 5.2 Scalability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-SCALE-01** | Support 660 active tenants by Month 12 | BRD OBJ-01 |
| **N-SCALE-02** | Support 1,055 active tenants by Month 18 | BRD ch.02 |
| **N-SCALE-03** | Support 40,000 MAU by Month 18 | BRD OBJ-10 |
| **N-SCALE-04** | Horizontal scaling of API workers | Add workers linearly with load |
| **N-SCALE-05** | Database read scaling | Read replicas for analytics queries |
| **N-SCALE-06** | Queue scaling | Redis-backed queues with worker auto-scaling |

### 5.3 Reliability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-REL-01** | Platform downtime > 4 hours | < 1 event per year (BRD R-02) |
| **N-REL-02** | Data loss | Zero (point-in-time recovery via WAL) |
| **N-REL-03** | Failed payment retry | 3 attempts with exponential backoff |
| **N-REL-04** | LLM provider failover | < 2 seconds to fallback |

### 5.4 Availability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-AVAIL-01** | Scheduled maintenance windows | < 4 hours/month, announced 48h in advance |
| **N-AVAIL-02** | Unplanned downtime | < 43 minutes/month (99.9% SLA) |
| **N-AVAIL-03** | Multi-AZ deployment | Primary + standby in separate AZs |
| **N-AVAIL-04** | Backup frequency | Continuous WAL + daily snapshots |

### 5.5 Maintainability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-MAINT-01** | Deployment frequency | Weekly minimum |
| **N-MAINT-02** | Lead time for changes | < 3 days (illustrative) |
| **N-MAINT-03** | Mean time to recovery (MTTR) | < 1 hour |
| **N-MAINT-04** | Test coverage | > 80% unit test, > 60% integration test |
| **N-MAINT-05** | Documentation | API docs auto-generated from OpenAPI |

### 5.6 Portability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-PORT-01** | Containerized deployment | Docker for all services |
| **N-PORT-02** | Cloud provider agnostic | Deployable to AWS, GCP, or Azure |
| **N-PORT-03** | Database migration | Alembic-managed schema migrations |

### 5.7 Usability Requirements

| ID | Requirement | Target |
|---|---|---|
| **N-USE-01** | Agent onboarding time | < 30 minutes for basic conversation handling |
| **N-USE-02** | Tenant admin onboarding | < 2 hours to go live (channel connected, AI configured) |
| **N-USE-03** | Dashboard responsiveness | < 100ms for UI interactions |

---

## 6. Data Requirements

### 6.1 Logical Data Model

See SAD Chapter 24 (Domain Model) and Chapter 25 (ERD) for the complete entity-relationship model. Key entities:

#### 6.1.1 Core Entities

| Entity | Description | Key Relationships |
|---|---|---|
| **Tenant** | Paying organization | Has Teams, Users, Plans |
| **Team** | Organizational unit within tenant | Has Members, Conversations, KBs |
| **User** | Tenant employee | Has TeamMemberships, TenantRoleAssignments |
| **CustomerIdentity** | Real person (cross-channel) | Has Contacts, ConversationSummaries |
| **Contact** | Channel-specific identity | Belongs to CustomerIdentity, initiates Conversations |
| **Conversation** | Message thread | Has Messages, AIReplyAttempts, InternalNotes |
| **Message** | Individual message | Belongs to Conversation |
| **KnowledgeBase** | Document collection | Has KBDocuments |
| **Plan** | Subscription tier | Subscribed by Tenant |

#### 6.1.2 Platform Entities

| Entity | Description |
|---|---|
| **PlatformUser** | Omnilinks staff (separate auth, separate table) |

### 6.2 Data Retention

| Data Type | Retention | Rationale |
|---|---|---|
| Messages | Per-tenant configurable, default 2 years | BRD ch.10 data lifecycle |
| AI Reply Attempts | 90 days | Debugging/auditing |
| Conversation Summaries | Lifetime of CustomerIdentity | Cross-channel continuity |
| Audit Logs | 7 years (immutable) | Compliance |
| Raw Webhooks | 30 days | Debugging |
| Analytics Aggregates | Indefinite | Business intelligence |

### 6.3 Data Migration

| Requirement | Description |
|---|---|
| **DM-01** | Schema migrations via Alembic, version-controlled |
| **DM-02** | Zero-downtime migrations for additive changes |
| **DM-03** | Data seeding for system templates (roles, permissions, plans) |

---

## 7. Security Requirements

### 7.1 Authentication

| ID | Requirement |
|---|---|
| **SEC-AUTH-01** | JWT access tokens: 15-minute expiry |
| **SEC-AUTH-02** | JWT refresh tokens: 7-day expiry, stored hashed |
| **SEC-AUTH-03** | Redis token blacklist for immediate revocation |
| **SEC-AUTH-04** | Password hashing: bcrypt with cost factor 12 |
| **SEC-AUTH-05** | Mandatory MFA for Platform Users (TOTP) |
| **SEC-AUTH-06** | SSO/SAML support for Enterprise tenants (P1) |

### 7.2 Authorization

| ID | Requirement |
|---|---|
| **SEC-AUTHZ-01** | Permission-based RBAC — never check role names in code |
| **SEC-AUTHZ-02** | Tenant-scoped data access enforced via PostgreSQL RLS |
| **SEC-AUTHZ-03** | Team-scoped data access enforced via application-layer filtering |
| **SEC-AUTHZ-04** | Platform users never access tenant data except via break-glass |
| **SEC-AUTHZ-05** | Break-glass access: time-boxed, reason-required, audit-logged, tenant-visible |

### 7.3 Data Protection

| ID | Requirement |
|---|---|
| **SEC-DATA-01** | AES-256-GCM encryption at rest via KMS envelope encryption |
| **SEC-DATA-02** | TLS 1.3 for all data in transit |
| **SEC-DATA-03** | PII auto-redaction in logs and AI training data |
| **SEC-DATA-04** | Tenant data isolation via RLS (Critical risk R-05 mitigation) |
| **SEC-DATA-05** | Secure deletion of data per right-to-erasure requests |

### 7.4 Application Security

| ID | Requirement |
|---|---|
| **SEC-APP-01** | Input validation via Pydantic on all API endpoints |
| **SEC-APP-02** | SQL injection prevention via SQLAlchemy ORM (no raw SQL) |
| **SEC-APP-03** | XSS prevention via output encoding |
| **SEC-APP-04** | CSRF protection for state-changing operations |
| **SEC-APP-05** | Rate limiting: per-IP, per-user, per-tenant |
| **SEC-APP-06** | WAF rules for common attack patterns |

---

## 8. Compliance & Regulatory Requirements

### 8.1 Data Protection

| Market | Regulation | Requirements |
|---|---|---|
| Egypt | PDPL (Law 151/2020) | Consent capture, right to erasure, cross-border transfer restrictions |
| Saudi Arabia | PDPL (Royal Decree M/19) | SDAIA registration, SCCs/BCRs for cross-border, 72-hour breach notification |
| UAE | Federal Decree-Law No. 45/2021 | Audit logs, data subject rights |
| Qatar | Law No. 13/2016 | Prior declaration for processing, cross-border transfer authorization |
| Morocco | Law 09-08 | CNDP declaration/authorization for processing |

### 8.2 Payment Compliance

| Requirement | Status |
|---|---|
| PCI-DSS scope | SAQ-A (self-attestation) via Paymob hosted checkout/tokenization |
| Full PCI-DSS program | Not applicable unless handling raw card data |

### 8.3 AI Governance

| Requirement | Status |
|---|---|
| Prompt/response logging | Planned — for R-03 human-in-the-loop review |
| AI output moderation | Planned — content filtering |
| Model version tracking | Planned — for R-18 drift detection |
| AI risk classification | TBD — define before launch |
| Prompt injection protection | Future — not yet scoped |
| Customer data for model training | Explicitly opt-out by default; contractual guarantee required per provider |

---

## 9. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **AI Credit** | 1 AI-generated response to a customer message (BRD ch.09) |
| **Contact** | Channel-specific identity of a tenant's end-customer |
| **CustomerIdentity** | Cross-channel unified identity of a real person |
| **ConversationSummary** | AI-generated summary of a closed conversation for cross-channel continuity |
| **RLS** | Row-Level Security — PostgreSQL policy-based tenant isolation |
| **SAQ-A** | PCI-DSS Self-Assessment Questionnaire A (lightest compliance tier) |
| **Tenant** | Paying organization using the platform |
| **UnifiedEvent** | Normalized message format across all channels |

### Appendix B: Requirement Traceability Matrix

| SRS Requirement | BRD Reference | SAD Reference | Priority |
|---|---|---|---|
| F-ING-01 to F-ING-13 | ch.01, ch.07 | ch.18, ch.26, ch.27 | P0 |
| F-AI-01 to F-AI-16 | ch.01, ch.03 | ch.19, ch.28, ch.29 | P0 |
| F-RAG-01 to F-RAG-09 | ch.01, ch.07 | ch.28, ch.29 | P0 |
| F-AGENT-01 to F-AGENT-10 | ch.03, ch.07 | ch.20, ch.24 | P0/P1 |
| F-LLM-01 to F-LLM-07 | ch.01, ch.08 R-16 | ch.28, ch.29 | P0/P1 |
| F-BILL-01 to F-BILL-10 | ch.09 | ch.23 | P0/P1 |
| F-ANALYTICS-01 to F-ANALYTICS-06 | ch.06 | ch.33 | P1 |
| F-TENANT-01 to F-TENANT-11 | ch.07, ch.13 | ch.13, ch.14, ch.24, ch.25 | P0/P1 |
| F-SEC-01 to F-SEC-12 | ch.08, ch.10 | ch.31, ch.32 | P0 |
| F-OUT-01 to F-OUT-06 | ch.07 | ch.18, ch.27 | P0 |
| N-PERF-01 to N-PERF-07 | ch.02, ch.06 | ch.30, ch.33 | — |
| N-SCALE-01 to N-SCALE-06 | ch.02, ch.08 R-17 | ch.30 | — |
| SEC-AUTH-01 to SEC-APP-06 | ch.08, ch.10 | ch.31, ch.32 | P0 |

### Appendix C: Open Items

| ID | Description | Blocking |
|---|---|---|
| **OI-01** | Confirm Paymob hosted checkout/tokenization mode (PCI-DSS SAQ-A scope) | Yes — payment architecture |
| **OI-02** | Select payment processor for Qatar and Morocco | Yes — market entry |
| **OI-03** | Validate $65/$500/$2,000 ARPU with pilot customers | No — financial model |
| **OI-04** | Define Gross Margin % for unit economics | No — LTV/CAC calculation |
| **OI-05** | Resolve Fernet (AES-128) vs. AES-256-GCM encryption mismatch | Yes — security architecture |
| **OI-06** | Select cloud provider (AWS/GCP/Azure) | Yes — deployment |
| **OI-07** | Select Gemma 4 variant (E2B/E4B/12B/26B-MoE/31B-Dense) | No — local inference path |
| **OI-08** | Define AI risk classification framework | Yes — AI governance |
| **OI-09** | Confirm whether customer prompts are used for LLM provider training | Yes — AI data governance |
| **OI-10** | Define RTO/RPO targets for disaster recovery | No — DR planning |
| **OI-11** | Resolve AI provider count (6 claimed vs. 4 named) | No — documentation |
| **OI-12** | Define annual billing discount percentage (15–20% placeholder) | No — pricing |
| **OI-13** | Define CustomerIdentity merge logic (phone matching, explicit linking, manual merge) | No — UX |
| **OI-14** | Define ConversationSummary quality bar and generation prompt | No — AI experience |
| **OI-15** | Define how many ConversationSummary rows to surface (last 3? 30 days? all-time?) | No — AI cost/performance |

---

> **End of SRS v1.0**
>
> **Next:** Engineering implementation per SAD v0.1.0. This SRS should be reconciled with the PRD and SAD at each milestone.
