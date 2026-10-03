# Routing Domain — Implementation Specification

> Status: **Implemented vertical slice**

## 1. Responsibility

Routing transforms operational context into an explainable assignment decision.

Routing is not authorization and does not create permission.

## 2. Routing Context

Normalized context:

~~~json
{
  "organizationId": "org_123",
  "conversationId": "conv_123",
  "channel": "whatsapp",
  "language": "ar-EG",
  "priority": "high",
  "slaDeadline": "...",
  "requiredSkills": ["billing"],
  "programId": "program_7",
  "currentControl": "queue"
}
~~~

Context is loaded from authoritative domain state.

## 3. Policy Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ ROUTING_POLICY : owns
    ROUTING_POLICY ||--o{ ROUTING_POLICY_VERSION : versions
    ROUTING_POLICY_VERSION ||--o{ ROUTING_RULE : contains
    ROUTING_POLICY_VERSION ||--o{ ROUTING_DECISION : produces
    ROUTING_DECISION ||--o{ ROUTING_CANDIDATE : evaluates
~~~

Published policy versions are immutable.

## 4. Evaluation Pipeline

~~~mermaid
flowchart TD
CONTEXT[Routing Context] --> POLICY[Load Policy Version]
POLICY --> SCOPE[Hard Scope Filter]
SCOPE --> AUTH[Authorization Filter]
AUTH --> SKILL[Skill Filter]
SKILL --> PRESENCE[Presence Filter]
PRESENCE --> CAPACITY[Capacity Filter]
CAPACITY --> SLA[Priority / SLA]
SLA --> SCORE[Candidate Score]
SCORE --> TIE[Deterministic Tie Break]
TIE --> ASSIGN[Decision]
~~~

## 5. Hard vs Soft Constraints

Hard filters:

- organization mismatch;
- invalid scope;
- missing authorization;
- disabled worker;
- missing required skill;
- insufficient capacity;
- policy prohibition.

Soft ranking:

- load balance;
- affinity;
- skill proficiency;
- SLA urgency;
- configured priority.

A soft score can never override a hard rejection.

## 6. Candidate Snapshot

For explainability, a decision records the observed candidate state:

~~~text
candidate_id
eligible
rejection_reason
skills
presence
capacity
score
policy_version
observed_at
~~~

This prevents later state changes from making an old decision impossible to explain.

## 7. Deterministic Score

Example:

~~~text
score =
  skill_weight * skill_match
  + sla_weight * urgency
  + load_weight * inverse_load
  + affinity_weight * affinity
~~~

Weights belong to policy configuration.

## 8. Tie Breaking

Stable final ordering:

~~~text
priority
skill score
worker_id ascending
~~~

Never randomize when reproducibility is required.

## 9. Routing Decision Record

~~~json
{
  "decisionId": "uuid",
  "policyVersion": 7,
  "selected": "worker_42",
  "queue": null,
  "reasonCodes": [
    "billing_skill",
    "arabic",
    "lowest_load"
  ]
}
~~~

## 10. No-Match State

~~~mermaid
stateDiagram-v2
    [*] --> EVALUATING
    EVALUATING --> ASSIGNED
    EVALUATING --> QUEUED
    QUEUED --> REEVALUATING
    REEVALUATING --> ASSIGNED
    QUEUED --> ESCALATED
    ESCALATED --> REEVALUATING
~~~

Queueing is a valid business outcome.

## 11. Re-Routing

Triggers:

- worker disabled;
- presence expired;
- queue SLA warning;
- customer escalation;
- AI handoff;
- supervisor override;
- skill/policy change.

Previous assignment remains historical.

## 12. Manual Override

Manual assignment requires permission.

Record:

~~~text
actor
previous_assignment
new_assignment
reason
timestamp
~~~

Manual override does not automatically disable future routing.

## 13. Transaction Boundary

Routing decision can be calculated outside the assignment transaction.

Final assignment transaction must re-check:

- conversation version/control;
- candidate status;
- candidate capacity;
- organization ownership.

This prevents stale routing decisions from creating invalid assignments.

## 14. Failure Modes

| Failure | Behavior |
|---|---|
| invalid policy | reject publication |
| policy unavailable | safe queue/degraded rule |
| stale candidate | remove/re-evaluate |
| assignment race | transaction conflict |
| no candidate | queue |
| queue SLA breach | escalate |

## 15. Observability

- routing latency;
- candidate count;
- filter rejection distribution;
- selected worker;
- queue rate;
- reroute rate;
- manual override rate;
- policy version.

## 16. Tests

- deterministic score;
- tie;
- missing skill;
- authorization exclusion;
- stale presence;
- capacity race;
- policy version;
- no-match queue;
- manual override;
- stale assignment decision.

## 17. Acceptance

Routing is complete when decisions are deterministic, tenant-safe, explainable and concurrency-safe at assignment commit time.
