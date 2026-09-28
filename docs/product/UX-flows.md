# UX Flows — Implementation Specification

> Status: **Target production UX blueprint**

## 1. UX Principle

OMILINKS is an operational control surface. Every important UI state should answer:

~~~text
what is happening?
who owns it?
what can I do?
what will happen next?
what failed?
is the state current?
~~~

## 2. Organization Onboarding

~~~mermaid
stateDiagram-v2
    [*] --> ACCOUNT_CREATED
    ACCOUNT_CREATED --> ORG_PROVISIONING
    ORG_PROVISIONING --> ORG_READY
    ORG_PROVISIONING --> PROVISIONING_ERROR
    PROVISIONING_ERROR --> ORG_PROVISIONING
    ORG_READY --> CONFIGURING
    CONFIGURING --> OPERATIONS_READY
~~~

UI must distinguish account creation from completed organization provisioning.

## 3. BPO Setup

~~~text
organization
 -> client account
 -> program
 -> sector
 -> team
 -> workforce
 -> channels
 -> routing
 -> quality
~~~

Each scope change should display the current organization/client/program context.

## 4. Conversation Workspace

~~~mermaid
flowchart LR
LIST[Inbox] --> CONV[Conversation]
CONV --> CUSTOMER[Customer Context]
CONV --> CONTROL[AI / Human / Queue]
CONV --> ACTIONS[Authorized Actions]
CONV --> TIMELINE[Message + Event Timeline]
CONV --> AUDIT[Operational History]
~~~

The conversation view should not require navigation away from the conversation to understand assignment/control.

## 5. AI Control UX

Control states:

~~~text
AI CONTROL
HUMAN CONTROL
QUEUE CONTROL
~~~

Human takeover should visibly change the control state immediately.

Pending AI actions must be visually marked stale/canceled after takeover.

## 6. Outbound State UX

~~~text
CREATED
QUEUED
SENDING
SENT
DELIVERED
FAILED
UNKNOWN
RECONCILING
~~~

Never show UNKNOWN as FAILED. A timeout is not proof of failed delivery.

## 7. Routing UX

Routing decision details should be available to authorized supervisors:

~~~text
policy version
candidate count
rejection reasons
selected worker/queue
SLA/priority reason
~~~

The UI should not expose sensitive internal policy data to ordinary agents.

## 8. AI Agent Publishing

~~~mermaid
flowchart LR
DRAFT[Draft] --> VALIDATE[Validate Dependencies]
VALIDATE --> TEST[Test]
TEST --> REVIEW[Review]
REVIEW --> PUBLISH[Publish Version]
PUBLISH --> ACTIVE[Active]
VALIDATE --> ERROR[Error]
TEST --> ERROR
ERROR --> FIX[Fix]
FIX --> VALIDATE
~~~

Published versions become read-only.

## 9. Workflow UX

Versioning must be explicit:

~~~text
Workflow
 v3 published
 v4 draft
~~~

Editing v4 cannot mutate v3.

## 10. Knowledge UX

Display:

- source;
- document version;
- ingestion state;
- freshness;
- scope;
- indexing errors.

Deleting a source should show that retrieval is immediately disabled while cleanup continues asynchronously.

## 11. Quality UX

Reviewer view displays:

~~~text
conversation evidence
scorecard version
criteria
scores
critical findings
remediation
~~~

AI-generated findings should be clearly identified as proposals.

## 12. Billing UX

Billing status:

~~~text
trialing
active
past_due
suspended
canceled
~~~

Feature availability must come from backend entitlement state.

The UI must not turn a successful payment redirect into immediate entitlement activation.

## 13. Integration UX

~~~mermaid
stateDiagram-v2
    [*] --> CONFIGURING
    CONFIGURING --> VERIFYING
    VERIFYING --> ACTIVE
    VERIFYING --> ERROR
    ACTIVE --> DEGRADED
    DEGRADED --> ACTIVE
    ACTIVE --> DISCONNECTED
    ERROR --> CONFIGURING
~~~

A provider connection is active only after backend verification succeeds.

## 14. Error Handling

Every asynchronous feature requires:

- queued;
- running;
- succeeded;
- failed;
- retrying;
- canceled;
- unknown/reconciling where appropriate.

Errors must tell the operator whether retry is safe.

## 15. Accessibility

Critical controls need:

- keyboard access;
- focus restoration;
- semantic labels;
- text alternatives;
- non-color status;
- screen-reader state announcements.

## 16. Telemetry

UI telemetry should capture:

- action attempted;
- action outcome;
- latency;
- recovery action;
- feature usage.

Avoid collecting full customer message content.

## 17. Acceptance

UX is complete only when every important domain state has a truthful visual representation and every operator action maps to a real backend authorization/state transition.
