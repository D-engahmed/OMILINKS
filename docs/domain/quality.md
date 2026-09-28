# Quality Domain — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Responsibility

Quality evaluates conversations and operational outcomes using versioned scorecards and evidence.

It must be analytically rich without mutating operational source records.

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ QUALITY_PROGRAM : owns
    QUALITY_PROGRAM ||--o{ SCORECARD : uses
    SCORECARD ||--o{ SCORECARD_VERSION : versions
    SCORECARD_VERSION ||--o{ CRITERION : defines
    QUALITY_PROGRAM ||--o{ SAMPLING_RULE : uses
    QUALITY_PROGRAM ||--o{ QUALITY_EVALUATION : creates
    QUALITY_EVALUATION ||--o{ EVALUATION_FINDING : contains
    EVALUATION_FINDING ||--o{ REMEDIATION : creates
~~~

## 3. Scorecard Version

Fields:

~~~text
scorecard_id
version
status
published_at
criteria[]
calculation_policy_version
~~~

Published scorecards are immutable.

## 4. Criterion Contract

A criterion should define:

- criterion_id;
- name;
- applicability;
- evidence requirement;
- scoring method;
- weight;
- criticality;
- remediation mapping.

Avoid criteria that cannot be evaluated consistently.

## 5. Sampling

Sampling may be:

- random;
- stratified;
- risk-weighted;
- channel-weighted;
- agent-tenure weighted;
- triggered by policy block/handoff/customer complaint.

~~~mermaid
flowchart TD
CONV[Eligible Conversation] --> RULES[Sampling Rules]
RULES --> STRATA[Risk / Channel / Program]
STRATA --> SAMPLE[Sample Decision]
SAMPLE --> ASSIGN[Reviewer Assignment]
ASSIGN --> EVAL[Evaluation]
~~~

Sampling stores the rule/version that selected the case.

## 6. Evaluation State

~~~mermaid
stateDiagram-v2
    [*] --> QUEUED
    QUEUED --> ASSIGNED
    ASSIGNED --> IN_REVIEW
    IN_REVIEW --> SUBMITTED
    SUBMITTED --> CALIBRATION
    CALIBRATION --> COMPLETED
    IN_REVIEW --> RETURNED
    RETURNED --> IN_REVIEW
    IN_REVIEW --> CANCELED
~~~

## 7. Evaluation Record

Conceptual:

~~~text
evaluation_id
organization_id
program_id
conversation_id
scorecard_version_id
reviewer_id
status
total_score
critical_failure
started_at
completed_at
version
~~~

## 8. Evidence Model

Evidence must reference durable source records:

~~~text
message_id
tool_invocation_id
ai_run_step_id
workflow_step_run_id
provider_delivery_id
~~~

The evaluation stores evidence references and reviewer interpretation, not a rewritten copy of the source record.

## 9. Score Calculation

A score should be reproducible:

~~~text
criterion_result
 -> criterion weight
 -> calculation policy version
 -> total
~~~

If score calculations change, create a new policy/version rather than silently recomputing history.

## 10. Critical Failures

Critical findings may bypass aggregate score logic.

Examples:

- unauthorized data exposure;
- unauthorized tool;
- fabricated successful financial action;
- mandatory escalation missed;
- security policy violation.

A quality report can therefore be:

~~~text
score = 93
critical_failure = true
~~~

The critical failure must remain visible.

## 11. AI-Assisted Evaluation

AI may create proposed findings:

~~~mermaid
sequenceDiagram
participant S as Sampler
participant AI as AI Evaluator
participant H as Human Reviewer
participant DB as Quality DB
S->>AI: Evaluation case
AI-->>S: Proposed findings
S->>H: Reviewer package
H->>DB: Final evaluation
~~~

For high-impact records, the AI proposal is not authoritative unless policy explicitly allows it.

## 12. Calibration

Calibration record contains:

~~~text
case_id
scorecard_version
reviewer_a
reviewer_b
criterion_disagreement
adjudication
rubric_change_reference
~~~

Persistent disagreement is a signal that the rubric may be ambiguous.

## 13. Remediation

Finding can create:

- coaching task;
- knowledge update;
- prompt update;
- routing policy change;
- guardrail update;
- workflow correction;
- engineering defect.

Preserve causal linkage:

~~~text
conversation
 -> evaluation
 -> finding
 -> remediation
 -> change
~~~

## 14. Concurrency

Two reviewers should not both finalize the same evaluation.

Use:

- evaluation version;
- row lock;
- assignment ownership.

Stale reviewer submission returns conflict.

## 15. Retention

Evaluation may outlive message access depending on policy. Evidence references must indicate unavailable/expired source state rather than inventing missing evidence.

## 16. Failure Modes

| Failure | Behavior |
|---|---|
| invalid scorecard | reject publication |
| scorecard changed mid-review | preserve original version |
| reviewer scope revoked | assignment invalid/reassign |
| evidence deleted | mark evidence unavailable |
| AI evaluator down | human queue |
| duplicate sampling trigger | one sampling/evaluation identity |

## 17. Observability

Track:

- sample rate;
- queue age;
- evaluation SLA;
- reviewer utilization;
- critical finding rate;
- disagreement;
- remediation age.

## 18. Tests

- score calculation;
- scorecard immutability;
- duplicate sample;
- stale reviewer submission;
- evidence authorization;
- AI proposal vs final human result;
- critical failure;
- remediation linkage;
- cross-tenant evaluation access.

## 19. Acceptance

Quality is complete when every score is reproducible from its scorecard version and evidence, and every critical finding can produce a traceable remediation path.
