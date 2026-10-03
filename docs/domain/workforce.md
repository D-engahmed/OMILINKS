# Workforce Domain — Implementation Specification

> Status: **Implemented vertical slice**

## 1. Aggregate Responsibilities

Workforce models humans and AI as operational workers without collapsing their security models.

Owns:

- workforce members;
- skills;
- teams;
- presence;
- capacity;
- queues;
- assignments;
- handoffs.

Authorization is consumed from Identity and is never granted by workforce presence.

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ WORKFORCE_MEMBER : owns
    WORKFORCE_MEMBER ||--o{ SKILL_ASSIGNMENT : has
    WORKFORCE_MEMBER ||--o{ PRESENCE : records
    WORKFORCE_MEMBER ||--o{ CAPACITY_SNAPSHOT : records
    TEAM ||--o{ TEAM_MEMBER : contains
    WORKFORCE_MEMBER ||--o{ ASSIGNMENT : receives
    CONVERSATION ||--o{ ASSIGNMENT : creates
    QUEUE ||--o{ QUEUE_ITEM : contains
~~~

## 3. Worker Record

Conceptual fields:

~~~text
workforce_member_id
organization_id
type = human|ai
status = provisioning|active|disabled
display_name
user_id nullable
ai_agent_id nullable
team_id nullable
created_at
updated_at
version
~~~

Do not use one overloaded status to represent lifecycle, presence and capacity.

## 4. Presence

Presence is operational availability:

~~~text
OFFLINE
AVAILABLE
BUSY
AWAY
UNKNOWN
~~~

Each presence update has:

~~~text
worker_id
state
observed_at
source
expires_at
~~~

Presence becomes stale after a defined TTL.

## 5. Capacity

Capacity is workload budget, not security:

~~~text
max_concurrent_work
active_work
reserved_work
effective_capacity
~~~

Human and AI workers can use different capacity algorithms.

## 6. Assignment Aggregate

An assignment records:

~~~text
assignment_id
organization_id
conversation_id
workforce_member_id
queue_id nullable
team_id nullable
status
reason
routing_decision_id nullable
assigned_by
assigned_at
released_at
version
~~~

Keep assignment history instead of mutating one assignee field.

## 7. Assignment State

~~~mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> RELEASED
    ACTIVE --> COMPLETED
    ACTIVE --> TRANSFERRED
    ACTIVE --> CANCELED
~~~

Only one active control owner exists unless co-assignment is explicitly modeled.

## 8. Concurrency

Assignment creation is transaction-sensitive.

~~~text
BEGIN
  lock conversation control row
  verify candidate eligibility
  verify current control version
  close current assignment
  create new assignment
  increment conversation control version when control changes
COMMIT
~~~

A losing concurrent assignment operation receives conflict and re-evaluates.

## 9. Handoff

Handoff is a control transfer, not just an assignee change.

Record:

~~~text
source_controller
target_controller
reason_code
trigger
conversation_control_version
timestamp
context_summary_reference
~~~

Human takeover invalidates stale autonomous work.

## 10. Queue

Queue is durable work state.

Fields:

~~~text
queue_id
organization_id
scope
required_skills
priority_policy
sla_policy
item_count
oldest_item_at
status
~~~

Queue items retain original creation time and routing attempt history.

## 11. Routing Inputs

Workforce exposes to routing:

- active skills;
- presence;
- capacity;
- team;
- scope;
- current assignment count.

It never returns authorization as a capability. Authorization is separately evaluated.

## 12. Scheduling

Keep distinct:

~~~text
schedule = planned availability
presence = observed availability
capacity = allowed workload
~~~

A worker can be scheduled but offline, or online but at capacity.

## 13. Commands

Examples:

- CreateWorkforceMember;
- ActivateWorkforceMember;
- DisableWorkforceMember;
- SetSkills;
- RecordPresence;
- ReserveCapacity;
- AssignConversation;
- ReleaseAssignment;
- TransferAssignment;
- EnqueueConversation.

## 14. Invariants

- disabled worker cannot receive new work;
- expired presence cannot qualify new work;
- active assignment belongs to same organization as conversation;
- skill scope cannot cross organization;
- queue item cannot disappear without terminal disposition;
- AI member cannot bypass AI policy.

## 15. Failure Modes

| Failure | Behavior |
|---|---|
| worker disabled during assignment | preserve history, re-route future work |
| stale presence | exclude from new assignment |
| capacity exceeded | candidate rejected |
| assignment race | transaction conflict |
| no candidate | durable queue |
| handoff destination unavailable | queue |
| worker deletion requested | lifecycle/retention workflow |

## 16. Observability

Metrics:

- active workers;
- availability rate;
- capacity utilization;
- queue depth;
- oldest queue age;
- assignment latency;
- reassignment rate;
- handoff rate;
- SLA breach.

## 17. Tests

- presence expiry;
- capacity race;
- two simultaneous assignments;
- disabled worker;
- cross-tenant worker ID;
- team scope mismatch;
- AI/human handoff race;
- queue recovery.

## 18. Current Runtime Evidence

Phase 4 now implements workforce members, tenant-scoped skills, presence with TTL, capacity state, teams, queues, assignment release, and routing decision persistence.

The remaining workforce features such as scheduling/calendar availability and automatic queue draining are future work.

## 19. Acceptance

Workforce is complete when assignment concurrency, queue durability, worker lifecycle, presence freshness and handoff control are proven independently.
