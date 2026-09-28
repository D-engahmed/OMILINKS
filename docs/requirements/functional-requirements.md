# Functional Requirements

> Status: **Target production product contract**

## 1. Product Objective

OMILINKS is a multi-tenant Customer Operations Platform for businesses and BPO/service providers.

The system must support the full operational loop:

~~~text
customer contact
 -> conversation
 -> routing
 -> human/AI handling
 -> authorized actions
 -> workflow
 -> resolution
 -> quality
 -> analytics
 -> billing
~~~

The design must support both direct businesses and BPOs without maintaining separate product architectures.

## 2. Organization and BPO Model

### Direct business

An organization operates its own customer operations.

### BPO

An organization manages external client accounts and their operational programs.

Core hierarchy:

~~~mermaid
flowchart TB
ORG[Organization] --> CLIENT[Client Account]
ORG --> PROGRAM[Program]
CLIENT --> PROGRAM
PROGRAM --> SECTOR[Sector]
SECTOR --> TEAM[Team]
TEAM --> WORKFORCE[Workforce]
~~~

The Client Account layer is optional.

## 3. Tenancy

The system shall:

- create a unique Organization;
- associate tenant-owned records with an organization;
- support membership and scoped access;
- support organization lifecycle;
- prevent cross-tenant access;
- support multiple clients/programs/sectors/teams;
- maintain audit history for privileged tenant changes.

## 4. Identity and Access

The system shall:

- represent human users independently of memberships;
- support organization-specific roles;
- support scoped permissions;
- support service principals;
- revoke credentials;
- audit privileged changes;
- prevent client input from selecting an unauthorized organization.

## 5. Customer Management

The system shall:

- create canonical customers;
- attach provider identities;
- search customers within authorized scope;
- maintain tags/attributes;
- maintain consent where required;
- support controlled identity merge;
- preserve merge history.

## 6. Conversation Management

The system shall:

- create/update canonical conversations;
- persist inbound/outbound messages;
- retain provider message identifiers;
- support assignments;
- support human/AI control;
- track delivery state;
- support resolution/reopen;
- preserve operational history.

## 7. Omnichannel Support

Initial channel integrations:

- WhatsApp;
- Instagram;
- Facebook;
- Telegram;
- SMS;
- web/widget.

Each integration shall map to the same canonical Customer/Conversation model while preserving provider-specific identifiers and capabilities.

## 8. Routing

The system shall:

- evaluate routing policy;
- filter candidates by tenant/scope;
- filter by required skills;
- consider workforce presence/capacity;
- apply priority/SLA;
- record routing decision evidence;
- queue unroutable work;
- support controlled rerouting;
- support supervisor override.

## 9. Workforce

The system shall:

- represent human and AI workforce members;
- maintain skills;
- track presence;
- track capacity;
- maintain assignment history;
- support queues;
- support human handoff.

Presence is not permission.

## 10. AI Workforce

The system shall:

- define AI agents;
- version agent policies;
- control model routing;
- control context;
- control tools;
- enforce guardrails;
- enforce autonomy budgets;
- create traceable AI runs;
- support human handoff;
- measure usage/cost;
- support evaluation.

## 11. Knowledge

The system shall:

- ingest documents/sources;
- create immutable versions;
- chunk/index content;
- filter retrieval by tenant/scope;
- track freshness;
- retain provenance;
- remove deleted/disabled content from effective retrieval;
- prefer deterministic business tools where live state is required.

## 12. Tools

The system shall:

- maintain a tool registry;
- version tool contracts;
- validate arguments;
- enforce permissions;
- enforce entitlements;
- support approval;
- support idempotency;
- isolate credentials;
- sanitize results;
- audit invocations.

## 13. Workflows

The system shall:

- define versioned workflows;
- create durable runs;
- support conditions/actions/timers/approvals;
- persist step state;
- support retries;
- prevent duplicate side effects;
- survive worker restarts;
- model partial external success;
- support cancellation.

## 14. Quality

The system shall:

- define quality programs;
- define scorecards;
- version scorecards;
- sample conversations;
- assign reviewers;
- capture evidence;
- preserve findings;
- create remediation references;
- support AI-assisted evaluation as proposals;
- support calibration.

## 15. Billing

The system shall:

- define plans;
- define entitlements;
- create subscriptions;
- meter usage;
- process payment events;
- reconcile provider state;
- support suspension;
- prevent quota bypass;
- preserve billing history.

## 16. Integrations

Provider integrations shall:

- verify inbound requests;
- persist integration events;
- normalize provider payloads;
- support provider-specific retries;
- expose connection health;
- isolate provider failures;
- maintain credential lifecycle.

Paymob and n8n must follow the same tenant/security boundary as channels.

## 17. Analytics

Analytics shall provide dimensions for:

- conversations;
- channel;
- workforce;
- AI;
- routing;
- SLA;
- quality;
- usage;
- billing.

Analytics is derived from operational facts; dashboards must not become the primary source of business truth.

## 18. Audit

Audit is required for:

- authorization-sensitive changes;
- tenant hierarchy changes;
- credential changes;
- customer merges;
- conversation control;
- privileged exports;
- AI policy changes;
- tool invocation;
- workflow approval;
- billing changes.

## 19. Notifications

Notification behavior should be event-driven and should not block customer message ingestion.

## 20. Search and Export

Search and export must respect tenant and effective scope.

Exports are asynchronous, permissioned, audited and expiring.

## 21. Operational Reliability

The system shall:

- use idempotency for retry-sensitive operations;
- preserve durable queues;
- use outbox for transactional event publication;
- classify failures;
- dead-letter poison events;
- provide health/readiness;
- expose operational metrics.

## 22. Non-Goals for Initial Architecture

The first architecture should not require:

- dozens of microservices;
- global event ordering;
- AI to directly access databases;
- n8n as the source of truth;
- vector search as the source of business truth;
- browser-side authorization;
- synchronous completion of long AI/workflow jobs.

## 23. Critical End-to-End Journey

~~~mermaid
sequenceDiagram
participant C as Customer
participant CH as Channel
participant O as OMILINKS
participant R as Routing
participant AI as AI/Human
participant T as Tool
participant Q as Quality
participant B as Billing
C->>CH: Message
CH->>O: Verified event
O->>O: Persist conversation
O->>R: Route
R->>AI: Assign
AI->>T: Optional authorized action
T-->>AI: Result
AI-->>O: Response
O->>CH: Delivery
O->>Q: Quality event
O->>B: Usage event
~~~

## 24. Acceptance Criteria

All functional requirements must map to:

~~~text
requirement
 -> domain rule
 -> API/event contract
 -> implementation
 -> automated test
 -> observability
 -> acceptance test
~~~

No feature is complete solely because its UI exists.
