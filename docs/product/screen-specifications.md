# Screen Specifications

> Status: **Target production UI contract**

Every screen specification must define purpose, data, actions, permissions, states, loading/error behavior and telemetry.

## 1. Application Shell

### Purpose

Provide stable navigation and global context.

### Regions

- organization/context selector;
- primary navigation;
- alert/incident center;
- global search;
- user/session menu.

### Rules

Organization switch must refetch authorized context. Local UI state cannot keep showing data from the previous organization after the switch.

## 2. Inbox

### Primary data

- conversation list;
- status;
- channel;
- customer;
- assignment;
- SLA;
- AI/human control;
- last message;
- unread state.

### Actions

- open;
- reply;
- assign;
- take control;
- release control;
- add tag;
- escalate;
- resolve;
- trigger workflow;
- inspect AI trace where permitted.

~~~mermaid
flowchart LR
LIST[Conversation List] --> DETAIL[Conversation Detail]
DETAIL --> CUSTOMER[Customer Context]
DETAIL --> CONTROL[Human / AI Control]
DETAIL --> ACTIONS[Authorized Actions]
DETAIL --> HISTORY[Audit / Assignment History]
~~~

## 3. Customer Screen

Display:

- canonical profile;
- channel identities;
- consent state where allowed;
- tags;
- conversation history;
- relevant business attributes.

The customer screen must not merge identities silently.

## 4. Workforce Screen

Display:

- team hierarchy;
- worker state;
- presence;
- skills;
- capacity;
- active assignments;
- queue load.

Provide supervisor actions only when authorized.

## 5. AI Screen

Display:

- AI agents;
- lifecycle state;
- policy version;
- model policy;
- knowledge policy;
- tool policy;
- budget;
- recent run outcomes;
- handoff/block metrics.

Published configuration should be read-only.

## 6. Knowledge Screen

Display:

- knowledge base;
- source list;
- source status;
- document versions;
- indexing status;
- errors;
- scope;
- freshness.

~~~mermaid
flowchart TD
KB[Knowledge Base] --> SOURCE[Source]
SOURCE --> VERSION[Document Version]
VERSION --> INDEX[Index Status]
INDEX --> READY[Retrieval Ready]
INDEX --> ERROR[Indexing Error]
~~~

## 7. Workflow Screen

Provide:

- workflow definition;
- version history;
- trigger;
- graph;
- step configuration;
- test execution;
- run history;
- dead letters.

Published version cannot be edited directly.

## 8. Quality Screen

Provide:

- sampling backlog;
- reviewer queue;
- scorecard;
- evaluation evidence;
- findings;
- remediation;
- calibration.

## 9. Billing Screen

Display:

- current subscription;
- plan;
- entitlement usage;
- invoices;
- payment state;
- reconciliation warnings.

Do not claim a plan is active based only on frontend checkout completion.

## 10. Settings

Areas:

- organization;
- members;
- roles/scopes;
- integrations;
- AI policy;
- channels;
- security;
- billing.

Sensitive configuration changes may require recent authentication.

## 11. UI State Matrix

Every resource screen should implement:

| State | Meaning |
|---|---|
| loading | request in progress |
| empty | valid no-data state |
| forbidden | user lacks permission |
| not_found | resource not available |
| error | recoverable/unexpected failure |
| stale | data known outdated |
| processing | background operation |
| partial | some dependent data unavailable |
| success | normal state |

## 12. URL State

Search, filters and pagination should be URL-addressable when appropriate.

The URL is navigation state, not authorization state.

## 13. Telemetry

Capture useful UI telemetry:

- feature usage;
- failed actions;
- screen load time;
- background-job visibility;
- handoff controls;
- user recovery actions.

Avoid recording sensitive customer content.

## 14. Acceptance Criteria

- Each screen handles all required states.
- UI actions reflect actual server authorization.
- Resource scope is visible.
- Long-running work displays durable status.
- Published configuration is not editable in place.
- Sensitive data is not unnecessarily emitted to analytics.
