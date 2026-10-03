# Phase 4 — Workforce + Routing

> Status: implemented vertical slice

Phase 4 turns a conversation from an unowned piece of work into a deterministic operational decision.

The engineering boundary is:

~~~text
operational state
   ↓
routing evaluation
   ↓
durable decision snapshot
   ↓
fresh transactional eligibility check
   ↓
assignment
~~~

Routing decides. The database transaction authoritatively commits.

## 1. System flow

~~~mermaid
flowchart TD
C[Conversation] --> CTX[Routing Context]
CTX --> POLICY[Published Policy Version]
POLICY --> EVAL[Pure Routing Engine]
STATE[Worker State] --> EVAL
EVAL --> DECISION[Routing Decision Snapshot]
DECISION --> COMMIT[Transactional Commit]
COMMIT --> ASSIGN[Assignment]
EVAL --> QUEUE[No Match]
QUEUE --> QITEM[Queue Item]
~~~

## 2. Worker state

A worker has three deliberately separate dimensions:

~~~text
lifecycle:
  ACTIVE / DISABLED

presence:
  OFFLINE / AVAILABLE / BUSY / AWAY / UNKNOWN

capacity:
  maximum concurrent work
  reserved work
  active work
~~~

Do not compress these into one status field.

## 3. Skills

Skills are tenant-owned vocabulary.

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ WORKFORCE_SKILL : owns
    WORKFORCE_MEMBER ||--o{ WORKFORCE_MEMBER_SKILL : has
    WORKFORCE_SKILL ||--o{ WORKFORCE_MEMBER_SKILL : assigned
~~~

A member skill has proficiency from 0 to 100.

Skill presence is a hard constraint when a routing request requires that skill.

## 4. Presence freshness

AVAILABLE does not stay valid forever.

~~~text
observed_at
expires_at
policy.presenceTtlSeconds
~~~

A worker qualifies only when:

~~~text
state == AVAILABLE
AND expires_at > now
AND observed_at >= now - configured TTL
~~~

This prevents a disappeared worker from receiving new work indefinitely.

## 5. Capacity

Capacity calculation:

~~~text
effective_capacity
  = max_concurrent_work
  - active_work
  - reserved_work
~~~

Standard Phase 4 assignments consume active_work. reserved_work is retained for a future reservation protocol.

The important invariant is:

~~~text
committed assignment
=> active_work increases

assignment release
=> active_work decreases automatically
   because active work is derived from assignment state
~~~

There is no second authoritative active-assignment counter.

## 6. Teams

Teams are an operational routing scope.

~~~text
Organization
  ├── Support Team
  ├── Billing Team
  └── Sales Team
~~~

A routing request may constrain a team. The engine rejects members outside that team.

## 7. Queues

A queue represents durable unowned work.

~~~mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> CLAIMED
    CLAIMED --> [*]
    QUEUED --> CANCELED
    QUEUED --> EXPIRED
~~~

The database allows historical queue items while enforcing one active QUEUED/CLAIMED item per conversation.

That is a partial uniqueness rule, not permanent uniqueness.

## 8. Routing policy versions

A policy is named configuration.

A policy version is the immutable configuration reference used by a decision.

~~~mermaid
flowchart LR
P[Routing Policy] --> V1[v1 retired]
P --> V2[v2 published]
V1 --> D1[Historical Decisions]
V2 --> D2[New Decisions]
~~~

Publishing a new version retires the previous published version. Old decisions still reference their original policy version.

## 9. Policy configuration

Current shape:

~~~text
allowedWorkerTypes
presenceTtlSeconds
weights.skill
weights.proficiency
weights.load
weights.urgency
defaultQueueId
~~~

Changing weights changes ranking behavior without changing the assignment safety transaction.

## 10. Hard eligibility filters

Routing first eliminates candidates.

~~~mermaid
flowchart TD
START[Candidate] --> ORG{Same organization?}
ORG -- no --> R1[Reject: ORGANIZATION_MISMATCH]
ORG -- yes --> TYPE{Worker type allowed?}
TYPE -- no --> R2[Reject: WORKER_TYPE_NOT_ALLOWED]
TYPE -- yes --> AUTH{Authorized?}
AUTH -- no --> R3[Reject: NOT_AUTHORIZED]
AUTH -- yes --> LIFE{Worker active?}
LIFE -- no --> R4[Reject: WORKER_DISABLED]
LIFE -- yes --> TEAM{Team matches?}
TEAM -- no --> R5[Reject: TEAM_SCOPE_MISMATCH]
TEAM -- yes --> SKILL{Required skills?}
SKILL -- no --> R6[Reject: MISSING_REQUIRED_SKILL]
SKILL -- yes --> PRES[Presence fresh?]
PRES -- no --> R7[Reject: PRESENCE_NOT_AVAILABLE]
PRES -- yes --> CAP{Capacity available?}
CAP -- no --> R8[Reject: CAPACITY_EXHAUSTED]
CAP -- yes --> ELIG[Eligible]
~~~

A score can rank eligible candidates. It cannot make a rejected candidate eligible.

## 11. Deterministic scoring

For eligible workers:

~~~text
score =
  skill_weight
  × skill_match
+
  proficiency_weight
  × average_proficiency
+
  load_weight
  × load_score
+
  urgency_weight
  × urgency_score
~~~

Load score:

~~~text
1 - active_work / max_concurrent_work
~~~

Important current-phase detail:

- required skills are hard filters, so eligible candidates already have full required-skill coverage;
- conversation priority is the same for every candidate in one routing decision.

Therefore the current `skill` and `urgency` weights shift the absolute score but do not distinguish candidates. In Phase 4, `proficiency` and `load` are the effective differentiators. Later routing can introduce preferred skills, affinity, SLA age, or other candidate-specific signals without changing the commit protocol.

Stable tie-break:

~~~text
score DESC
workforce_member_id ASC
~~~

No random routing.

## 12. Decision snapshot

Every routing attempt records:

~~~text
RoutingDecision
  ├── policy version
  ├── outcome
  ├── selected worker
  ├── queue
  ├── reason codes
  ├── requested skills
  └── context snapshot

RoutingCandidate
  ├── candidate
  ├── eligible
  ├── rejection code
  ├── score
  └── observed state snapshot
~~~

Example:

~~~mermaid
flowchart LR
D[Decision #71] --> A[Agent A: eligible score 86]
D --> B[Agent B: missing skill]
D --> C[Agent C: offline]
D --> E[Agent D: capacity exhausted]
~~~

This makes a historical routing decision explainable after current worker state changes.

## 13. Preview versus commit

This is the main concurrency design.

Bad:

~~~text
evaluate candidates
wait
insert assignment
~~~

Correct:

~~~mermaid
sequenceDiagram
participant R as Routing Engine
participant DB as PostgreSQL
R->>DB: Read worker state
R->>R: Compute decision
R->>DB: Persist decision snapshot
R->>DB: Begin commit transaction
DB->>DB: Lock conversation
DB->>DB: Lock worker
DB->>DB: Re-check version
DB->>DB: Re-check presence
DB->>DB: Re-check capacity
DB->>DB: Re-check skills
DB->>DB: Re-check team
DB->>DB: Create assignment
DB->>DB: Update conversation control
DB-->>R: Assignment committed
~~~

The decision can therefore be stale. The final transaction is authoritative.

## 14. Race example

At time T1:

~~~text
Agent A:
  AVAILABLE
  capacity = 1
  active = 0
~~~

Routing selects A.

At T2 another operation takes A's only slot.

The original decision is now stale.

At commit:

~~~text
active = 1
effective_capacity = 0
~~~

The transaction rejects the assignment with CAPACITY_EXHAUSTED.

No invalid assignment is created.

## 15. Assignment lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> RELEASED
    ACTIVE --> COMPLETED
    ACTIVE --> TRANSFERRED
    ACTIVE --> CANCELED
~~~

Release returns the conversation to queue control so the routing engine can consider it again.

COMPLETED currently transitions the conversation to WAITING_CUSTOMER.

## 16. API surface

Workforce:

~~~text
GET  /api/v1/workforce/members
POST /api/v1/workforce/members

GET  /api/v1/workforce/skills
POST /api/v1/workforce/skills

GET  /api/v1/workforce/members/{id}/skills
PUT /api/v1/workforce/members/{id}/skills

PUT /api/v1/workforce/members/{id}/presence
PUT /api/v1/workforce/members/{id}/capacity

GET  /api/v1/workforce/teams
POST /api/v1/workforce/teams
PUT /api/v1/workforce/teams/{id}/members

GET  /api/v1/workforce/queues
POST /api/v1/workforce/queues
~~~

Routing:

~~~text
GET  /api/v1/routing/policies
POST /api/v1/routing/policies

POST /api/v1/conversations/{id}/route

POST /api/v1/workforce/assignments
POST /api/v1/workforce/assignments/{id}/release
~~~

## 17. Failure model

~~~text
worker disabled
  -> candidate rejected

presence stale
  -> candidate rejected

capacity exhausted
  -> candidate rejected

skill changed after preview
  -> commit conflict

team changed after preview
  -> commit conflict

conversation changed after preview
  -> stale version conflict

no eligible worker
  -> queue

queue unavailable
  -> infrastructure failure
~~~

Routing failure is never silently converted into assignment.

## 18. Observability

Every decision contains enough evidence for:

~~~text
candidate_count
eligible_count
rejection_distribution
selected_worker
score
policy_version
routing_latency
outcome
queue_fallback
~~~

Later dashboards can derive:

~~~mermaid
flowchart LR
D[Routing Decisions] --> RATE[Assignment Rate]
D --> QUEUE[Queue Rate]
D --> REJECT[Rejection Distribution]
D --> LAT[Routing Latency]
D --> SLA[SLA Correlation]
~~~

## 19. Test evidence

Phase 4 tests cover:

~~~text
deterministic lower-load selection
deterministic ID tie-break
required skill rejection
stale presence rejection
queue fallback
worker assignment
capacity exhaustion
capacity restoration after release
policy version publishing
stale routing commit
candidate rejection evidence
tenant-scoped PostgreSQL behavior
~~~

## 20. What Phase 4 does not solve

~~~text
outbox publisher
general worker runtime
background queue drain
automatic rerouting scheduler
advanced scheduling/calendar logic
SLA scheduler
AI runtime
provider delivery
~~~

Those require the later event/worker phases.

## 21. Engineering mental model

When changing OmniLinks routing, think:

~~~text
State
 ↓
Eligibility
 ↓
Score
 ↓
Decision
 ↓
Re-check
 ↓
Commit
 ↓
History
~~~

Keep those stages separate.

That separation lets OmniLinks later support manual routing, skill routing, priority routing, BPO queue routing, SLA-aware routing, and AI routing without turning assignment safety into a giant conditional.
