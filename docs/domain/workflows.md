# Workflow Domain — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Workflow Model

A workflow is an immutable versioned graph executed through durable runs.

~~~text
WorkflowDefinition
 -> WorkflowVersion
 -> Trigger
 -> Step graph
 -> WorkflowRun
 -> StepRuns
~~~

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ WORKFLOW_DEFINITION : owns
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_VERSION : versions
    WORKFLOW_VERSION ||--o{ WORKFLOW_STEP : contains
    WORKFLOW_RUN }o--|| WORKFLOW_VERSION : executes
    WORKFLOW_RUN ||--o{ WORKFLOW_STEP_RUN : records
    WORKFLOW_RUN ||--o{ APPROVAL : waits_for
~~~

## 3. Definition Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> VALIDATING
    VALIDATING --> TESTING
    TESTING --> PUBLISHED
    PUBLISHED --> DISABLED
    DISABLED --> PUBLISHED
    PUBLISHED --> RETIRED
~~~

Published versions are immutable.

## 4. Run Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> RUNNING
    RUNNING --> WAITING
    WAITING --> RUNNING
    RUNNING --> SUCCEEDED
    RUNNING --> FAILED
    FAILED --> RETRYING
    RETRYING --> RUNNING
    FAILED --> DEAD_LETTERED
    RUNNING --> CANCELED
    WAITING --> CANCELED
    RUNNING --> PARTIALLY_COMPLETED
~~~

## 5. Trigger Contract

A trigger records:

~~~text
trigger_id
organization_id
source_event_id
workflow_version
dedupe_key
received_at
~~~

The trigger must be idempotent.

## 6. Step Contract

A step defines:

- step_id;
- type;
- input mapping;
- output mapping;
- retry policy;
- timeout;
- idempotency strategy;
- compensation strategy where needed;
- next-step conditions.

## 7. Execution Engine

~~~mermaid
flowchart TD
EVENT[Trigger] --> LOAD[Load Published Version]
LOAD --> STATE[Load Run State]
STATE --> READY[Select Ready Step]
READY --> LOCK[Lease / Concurrency Guard]
LOCK --> EXEC[Execute Step]
EXEC --> SUCCESS[Persist Success]
EXEC --> FAIL[Classify Failure]
SUCCESS --> NEXT[Compute Next Step]
FAIL --> RETRY{Retryable?}
RETRY -->|yes| WAIT[Schedule Retry]
RETRY -->|no| TERMINAL[Fail / Partial / DLQ]
WAIT --> READY
NEXT --> READY
~~~

## 8. Durable Waiting

A WAIT step stores:

~~~text
run_id
step_id
wake_at
wait_reason
resume_token
~~~

A worker does not stay allocated during the waiting period.

## 9. Step Idempotency

Side-effect steps use a deterministic execution identity.

~~~text
workflow_run_id
+ step_id
+ semantic attempt key
~~~

Duplicate event delivery finds the existing StepRun before repeating the action.

## 10. Human Approval

Approval is a durable state.

Approval binds to:

- exact action;
- action hash;
- workflow version;
- step;
- organization;
- requester;
- approver scope;
- expiry.

An edited action needs another approval.

## 11. Compensation

Example:

~~~text
step A = ticket created
step B = CRM updated
step C = notification failed
~~~

The system records partial completion and chooses:

- retry C;
- compensate A/B where supported;
- hand off for manual remediation.

A global rollback must not be claimed when the external world cannot actually roll back.

## 12. Cancellation

Cancellation checks:

- current run state;
- current step;
- external side effect status.

A running external provider operation may need reconciliation after cancellation.

## 13. Worker Crash Recovery

Recovery:

1. load run;
2. acquire lease;
3. identify latest StepRun;
4. inspect status;
5. reconcile unknown side effect;
6. transition to next safe state;
7. release lease.

## 14. Concurrency

Only one worker should own a run lease at a time.

~~~text
run_id
worker_id
lease_until
heartbeat
~~~

Lease expiry enables recovery.

## 15. Cross-Domain Calls

Workflow steps can call:

- AI runtime;
- Tool Runtime;
- Workforce;
- Notifications;
- external integrations.

All calls remain subject to their own authorization policies.

## 16. Failure Taxonomy

| Error | Behavior |
|---|---|
| invalid workflow version | do not start |
| duplicate trigger | return existing run |
| provider timeout | retry/reconcile |
| approval expired | escalation/fallback |
| permanent validation | fail |
| partial external effects | PARTIALLY_COMPLETED |
| worker crash | resume from durable state |
| entitlement loss | apply suspension policy |

## 17. Observability

Track:

- run duration;
- step duration;
- wait time;
- retries;
- dead letters;
- approvals;
- partial completion;
- version usage;
- queue age.

## 18. Test Vectors

- duplicate trigger;
- worker crash;
- lease expiry;
- long wait;
- approval mismatch;
- retry;
- dead letter;
- partial external success;
- cancellation;
- tenant isolation;
- workflow version immutability.

## 19. Acceptance

A workflow is production-ready when its graph version, durable state, idempotency, recovery and external side-effect semantics are deterministic and testable.
