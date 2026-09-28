# Workflow Domain

> Status: **Target production domain contract**

Workflows provide durable automation across conversations, AI, tools, integrations, human approvals and billing.

## 1. Why Durable Workflows

Automation can run for seconds, hours or days. A worker can restart while a workflow is waiting. A human can take several hours to approve a step. External providers can fail after a real-world side effect occurred.

Therefore a workflow is a durable state machine, not a frontend-only sequence.

## 2. Core Entities

| Entity | Responsibility |
|---|---|
| WorkflowDefinition | stable business identity |
| WorkflowVersion | immutable executable graph |
| WorkflowRun | execution instance |
| Step | logical node |
| StepRun | execution record |
| Trigger | event/API/schedule activation |
| Variable | durable run state |
| Approval | human decision |
| RetryState | persisted retry information |

## 3. Workflow Definition Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> TESTING
    TESTING --> PUBLISHED
    PUBLISHED --> DISABLED
    DISABLED --> PUBLISHED
    PUBLISHED --> RETIRED
~~~

A published workflow version is immutable.

## 4. Workflow Run Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> RUNNING
    RUNNING --> WAITING
    WAITING --> RUNNING
    RUNNING --> COMPLETED
    RUNNING --> FAILED
    FAILED --> RETRYING
    RETRYING --> RUNNING
    FAILED --> DEAD_LETTERED
    RUNNING --> CANCELED
    WAITING --> CANCELED
~~~

A run references exactly one workflow version.

## 5. Execution Graph

~~~mermaid
flowchart LR
TRIGGER[Conversation / Event] --> CONDITION{Condition}
CONDITION -->|AI eligible| AI[AI Step]
CONDITION -->|Human required| ASSIGN[Assign Human]
AI --> TOOL[Tool Step]
TOOL --> RESULT{Outcome}
RESULT -->|success| NOTIFY[Notification]
RESULT -->|retryable| RETRY[Retry]
RESULT -->|permanent| FAIL[Failure]
ASSIGN --> APPROVAL[Human Approval]
APPROVAL --> CONTINUE[Continue]
NOTIFY --> COMPLETE[Complete]
~~~

The graph is data. The worker executes it; the database stores its state.

## 6. Step Types

Conceptual step categories:

- condition;
- AI task;
- tool/action;
- assignment;
- notification;
- timer/wait;
- approval;
- webhook/API call;
- sub-workflow;
- terminal.

Each step type has a clear input/output contract and retry semantics.

## 7. Durable State

State required after worker termination must be persisted.

Do not rely on:

- process memory;
- local files;
- worker-local timers;
- browser state.

A 24-hour wait is a persisted wake-up timestamp/job, not a sleeping worker thread.

## 8. Idempotent Step Execution

Every side-effecting step has a deterministic semantic execution key.

Conceptually:

~~~text
workflow_run_id
+ step_id
+ attempt semantics
~~~

The exact implementation may differ, but duplicate delivery must not duplicate the business outcome.

## 9. Step State

~~~mermaid
stateDiagram-v2
    [*] --> READY
    READY --> RUNNING
    RUNNING --> SUCCEEDED
    RUNNING --> FAILED
    FAILED --> RETRY_SCHEDULED
    RETRY_SCHEDULED --> RUNNING
    FAILED --> PERMANENT_FAILURE
    RUNNING --> CANCELED
~~~

Step history is preserved across retries.

## 10. Human Approval

Approval contains:

- requested action;
- exact arguments/context;
- requester;
- authorized approver scope;
- expiration;
- decision;
- timestamp.

Approval must be bound to the exact action. Editing arguments creates a new approval requirement.

## 11. Trigger Model

Workflow triggers can originate from:

- conversation.created;
- conversation.message.received;
- assignment.changed;
- ai.run.completed;
- quality.evaluation.completed;
- subscription.changed;
- scheduled time;
- public API request;
- integration callback.

Triggers are tenant-scoped.

## 12. Workflow Context

A run may access:

- triggering event;
- permitted customer/conversation data;
- previous step output;
- approved tools;
- organization configuration;
- workflow variables.

Workflow context does not grant authorization.

## 13. Partial Success

External systems cannot always be rolled back.

Example:

~~~text
1. create ticket       SUCCESS
2. update CRM          SUCCESS
3. send notification   FAILED
~~~

The workflow must represent partial completion rather than claiming global rollback.

Possible state:

~~~text
PARTIALLY_COMPLETED
    -> retry failed step
    -> compensate completed steps if supported
    -> human intervention
~~~

## 14. Compensation

Compensation is explicit because external side effects may not be reversible.

Every compensatable action should document:

- original operation;
- compensation operation;
- compensation eligibility;
- ordering;
- failure behavior.

If compensation is impossible, the workflow records the real-world state and surfaces remediation.

## 15. Cancellation

Cancellation sources can include:

- tenant admin;
- workflow policy;
- customer resolution;
- subscription suspension;
- security incident.

Cancellation policy must distinguish already-started external work from queued work.

## 16. Cross-Domain Contracts

**Conversations:** workflows consume and update conversation state.

**AI:** workflows can start/stop AI runs under policy.

**Tools:** side-effecting steps use the Tool Runtime.

**Workforce:** workflows create assignments and approvals.

**Billing:** governed workflow execution consumes entitlements/usage.

**Events:** triggers and completion events use versioned event contracts.

## 17. Failure Modes

| Failure | Behavior |
|---|---|
| invalid publication | reject workflow version |
| worker crash | recover durable run |
| duplicate trigger | deduplicate run creation |
| step timeout | retry/reconcile according to type |
| approval expired | fallback/escalation path |
| partial success | preserve completed effects |
| entitlement suspension | apply configured workflow policy |

## 18. Observability

Track:

- runs started/completed/failed;
- step latency;
- wait duration;
- retry count;
- approval latency;
- dead letters;
- partial completions;
- workflow version usage;
- trigger source.

Every run and step carries correlation identifiers.

## 19. Acceptance Criteria

- Published versions are immutable.
- Runs survive worker restarts.
- Side-effecting steps define idempotency.
- Long waits do not occupy workers.
- Human approvals are durable and argument-bound.
- Partial side effects are represented honestly.
- Duplicate triggers do not duplicate business outcomes.
- Workflow execution is tenant-scoped and auditable.
