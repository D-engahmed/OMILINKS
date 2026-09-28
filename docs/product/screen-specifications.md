# Screen Specifications — Implementation Contract

> Status: **Target production screen blueprint**

## 1. Screen Contract

Every screen specifies:

~~~text
purpose
route
required permission
data dependencies
actions
loading state
empty state
forbidden state
error state
stale state
partial state
telemetry
~~~

## 2. Application Shell

### Route

~~~text
/app
/app/inbox
/app/customers
/app/workforce
/app/automation
/app/knowledge
/app/quality
/app/billing
/app/settings
~~~

### Global state

- active organization;
- effective scope;
- user identity;
- unread/task indicators;
- integration alerts.

Organization switch invalidates organization-scoped cached data.

## 3. Inbox

### Data

- conversation;
- customer;
- channel;
- assignment;
- SLA;
- control state;
- message timeline.

### Actions

- reply;
- assign;
- takeover;
- release;
- resolve;
- escalate;
- run workflow;
- inspect AI trace.

### Concurrency

Sending/assignment uses server-side version/control checks.

## 4. Customer Detail

Sections:

~~~text
summary
channel identities
consent
attributes
conversation history
operational tags
audit-relevant activity
~~~

Sensitive attributes are rendered only when permission allows.

## 5. Workforce

Show:

- worker lifecycle;
- presence freshness;
- skill set;
- capacity;
- team;
- current assignments;
- queue.

Supervisor operations require explicit permissions.

## 6. AI Agents

List:

~~~text
agent
status
current policy version
model policy
knowledge policy
tool policy
autonomy
last deployment
failure/handoff rate
~~~

Published configuration has no direct edit action.

## 7. Knowledge

Show:

- KB;
- source;
- version;
- ingestion state;
- scope;
- freshness;
- chunk/index status;
- errors.

## 8. Workflows

Show:

- workflow;
- versions;
- published state;
- graph;
- validation;
- runs;
- approvals;
- dead letters.

Run detail displays current step and retry history.

## 9. Quality

Show:

- review queue;
- scorecard version;
- evidence;
- findings;
- remediation;
- calibration.

## 10. Billing

Show:

- subscription;
- plan;
- entitlement usage;
- invoices;
- payment state;
- reconciliation warnings.

Provider return URL state is informational only.

## 11. Integrations

Each card exposes:

~~~text
connection status
provider/account
last successful inbound
last successful outbound
last webhook
error summary
reconnect
disable
~~~

## 12. Settings

Areas:

~~~text
organization
members
roles
integrations
AI
workflows
security
billing
~~~

Sensitive changes can require recent authentication.

## 13. State Matrix

~~~mermaid
stateDiagram-v2
    [*] --> LOADING
    LOADING --> READY
    LOADING --> EMPTY
    LOADING --> FORBIDDEN
    LOADING --> ERROR
    READY --> STALE
    READY --> PARTIAL
    READY --> PROCESSING
    PROCESSING --> READY
    PROCESSING --> ERROR
    STALE --> READY
~~~

## 14. URL State

Filters/pagination can be URL state.

Authorization is never URL state.

## 15. Acceptance

A screen is complete only when its data dependency graph and all lifecycle/error states are specified before implementation.
