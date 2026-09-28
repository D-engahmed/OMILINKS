# UX Flows

> Status: **Target production product contract**

OMILINKS is an operational platform. UX should optimize for work completion, control visibility, error recovery and trustworthy AI behavior rather than dashboard decoration.

## 1. BPO Onboarding Flow

~~~mermaid
flowchart LR
START[Create Organization] --> OWNER[Owner Membership]
OWNER --> CLIENT[Optional Client Account]
CLIENT --> PROGRAM[Program]
PROGRAM --> SECTOR[Sector]
SECTOR --> TEAM[Team]
TEAM --> WORKFORCE[Workforce]
WORKFORCE --> CHANNEL[Connect Channel]
CHANNEL --> ROUTING[Configure Routing]
ROUTING --> READY[Operations Ready]
~~~

Every setup step should make the resulting scope explicit.

## 2. Direct Business Onboarding

~~~mermaid
flowchart LR
ORG[Organization] --> SITE[Site / Operating Unit]
SITE --> WORK[Workforce]
WORK --> CHANNEL[Channel]
CHANNEL --> ROUTE[Routing]
ROUTE --> INBOX[Operations Inbox]
~~~

The user should not be forced through BPO-specific concepts that are irrelevant.

## 3. Incoming Conversation Flow

~~~mermaid
sequenceDiagram
participant C as Customer
participant CH as Channel
participant O as OMILINKS
participant R as Routing
participant A as AI/Human
C->>CH: Message
CH->>O: Webhook
O->>O: Create/update conversation
O->>R: Routing request
R->>A: Assign
A->>O: Response
O->>CH: Provider delivery
CH-->>C: Message
~~~

The UI should make each control boundary visible:

- source channel;
- current owner;
- AI/human control;
- delivery status;
- SLA status.

## 4. AI Handoff

~~~mermaid
stateDiagram-v2
    [*] --> AI_CONTROL
    AI_CONTROL --> HUMAN_REQUEST: customer asks
    AI_CONTROL --> POLICY_HANDOFF: risk/policy
    AI_CONTROL --> LOW_CONFIDENCE: confidence rule
    HUMAN_REQUEST --> HUMAN_CONTROL
    POLICY_HANDOFF --> HUMAN_CONTROL
    LOW_CONFIDENCE --> HUMAN_CONTROL
    HUMAN_CONTROL --> AI_CONTROL: explicitly returned
~~~

The customer-facing timeline should show that control changed.

## 5. Supervisor Workflow

A supervisor should be able to:

1. filter queue by SLA/risk/team;
2. open conversation;
3. inspect customer/context;
4. review AI actions;
5. reassign;
6. take control;
7. request QA;
8. initiate remediation.

The UI should expose reasons and history, not only current state.

## 6. Channel Connection UX

~~~mermaid
flowchart TD
SELECT[Select Integration] --> CRED[Configure Credential]
CRED --> VERIFY[Verify]
VERIFY --> WEBHOOK[Configure Webhook]
WEBHOOK --> TEST[Test Event]
TEST --> ACTIVE[Activate]
VERIFY --> ERROR[Connection Error]
WEBHOOK --> ERROR
TEST --> ERROR
ERROR --> REPAIR[Repair / Reconnect]
REPAIR --> VERIFY
~~~

Do not show an integration as active while webhook/credential health is incomplete.

## 7. AI Configuration UX

Agent configuration should be staged:

~~~text
Identity
 -> Purpose
 -> Knowledge
 -> Model policy
 -> Tool policy
 -> Handoff policy
 -> Budget
 -> Evaluation
 -> Test
 -> Publish
~~~

Publishing should validate dependencies before allowing activation.

## 8. Workflow Builder UX

A workflow editor needs:

- version state;
- trigger;
- steps;
- conditions;
- retries;
- approvals;
- test mode;
- publish action.

Do not allow editing a published version in place.

## 9. Billing Flow

~~~mermaid
flowchart LR
PLAN[Select Plan] --> CHECKOUT[Checkout]
CHECKOUT --> PROVIDER[Payment Provider]
PROVIDER --> VERIFIED[Verified Payment]
VERIFIED --> SUB[Subscription]
SUB --> ENT[Entitlements]
ENT --> UI[Feature Availability]
~~~

The UI can show "payment processing" until the verified backend state changes.

## 10. Error UX

Every important screen defines:

- loading;
- empty;
- error;
- forbidden;
- stale;
- partial;
- success;
- processing.

Example:

~~~text
Outbound message:
  queued
  sending
  delivered
  failed
  retrying
  unknown / reconciling
~~~

Do not show "failed" when the provider state is actually unknown.

## 11. AI Trust UX

AI-generated actions should be visually distinguishable from human actions.

Show where appropriate:

- AI/human author;
- policy status;
- tool action;
- approval state;
- source/grounding;
- confidence indicator when valid;
- handoff reason.

Avoid false precision such as displaying a numeric confidence score unless the measurement is meaningful and calibrated.

## 12. Operations First Navigation

Recommended information architecture:

~~~mermaid
flowchart TB
APP[OMILINKS Console]
APP --> INBOX[Inbox]
APP --> CUSTOMERS[Customers]
APP --> WORKFORCE[Workforce]
APP --> AUTOMATION[Automation]
APP --> KNOWLEDGE[Knowledge]
APP --> QUALITY[Quality]
APP --> ANALYTICS[Analytics]
APP --> BILLING[Billing]
APP --> SETTINGS[Settings]
~~~

Navigation visibility depends on permission and entitlement, but direct URL access still receives server authorization.

## 13. Responsive Behavior

The operations console should preserve critical workflow information on smaller screens.

Do not merely shrink desktop tables.

For complex tables:

- prioritize critical columns;
- use expandable row details;
- maintain access to action state;
- preserve filters and selection.

## 14. Accessibility

Use:

- keyboard navigation;
- semantic headings;
- accessible labels;
- focus management;
- sufficient contrast;
- non-color status cues;
- reduced-motion support;
- meaningful error messages.

## 15. Acceptance Criteria

- The user always knows who/what controls a conversation.
- Integration status reflects verified backend state.
- AI/human actions are distinguishable.
- Errors represent actual system state.
- Permissions hide UI but do not replace backend authorization.
- Published workflows/agents are not edited in place.
