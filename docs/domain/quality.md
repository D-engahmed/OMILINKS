# Quality Domain

> Status: **Target production domain contract**

The Quality domain measures operational quality across conversations, human agents, AI agents, teams, programs and clients. It creates evidence for improvement without rewriting the operational source of truth.

## 1. Quality Responsibility

The domain owns:

- quality programs;
- sampling policies;
- scorecards;
- scorecard versions;
- evaluation assignments;
- criteria;
- findings;
- reviewer decisions;
- remediation references;
- calibration metadata.

It does not mutate the conversation transcript to "fix" a quality score.

## 2. Quality Model

~~~mermaid
erDiagram
ORGANIZATION ||--o{ QUALITY_PROGRAM : owns
QUALITY_PROGRAM ||--o{ SCORECARD : uses
SCORECARD ||--o{ SCORECARD_VERSION : versions
SCORECARD_VERSION ||--o{ CRITERION : defines
CONVERSATION ||--o{ EVALUATION : evaluated
QUALITY_PROGRAM ||--o{ EVALUATION : produces
USER ||--o{ EVALUATION : reviews
EVALUATION ||--o{ FINDING : contains
FINDING ||--o{ REMEDIATION : creates
~~~

## 3. Quality Program

A Quality Program defines:

- population to sample;
- channels/programs/teams in scope;
- sampling rate or schedule;
- scorecard version;
- reviewer assignment policy;
- evaluation SLA;
- calibration policy;
- remediation workflow.

Example:

~~~text
Program: Egyptian Customer Support
Sampling: 5% of resolved conversations
Scorecard: Support-v7
Reviewer: QA Team
Evaluation SLA: 48 hours
~~~

## 4. Scorecard Versioning

A scorecard is a logical identity. A scorecard version is immutable.

~~~text
Support Quality
  v5 -> historical
  v6 -> historical
  v7 -> current
~~~

Completed evaluations reference the exact version used.

Changing criterion meaning requires a new version.

## 5. Criterion Model

A criterion should have:

- criterion ID;
- description;
- weight;
- pass/fail or scaled scoring rule;
- evidence requirement;
- applicability conditions;
- criticality;
- remediation mapping.

Avoid criteria such as "good conversation" without measurable interpretation.

## 6. Sampling

Sampling can be:

- random;
- stratified by channel;
- weighted toward high-risk conversations;
- weighted toward new agents;
- triggered by customer dissatisfaction;
- triggered by AI handoff;
- triggered by policy blocks.

~~~mermaid
flowchart TD
CONV[Resolved Conversation] --> ELIGIBLE[Sampling Eligibility]
ELIGIBLE --> STRATIFY[Channel / Program / Risk Stratification]
STRATIFY --> SAMPLE[Sampling Policy]
SAMPLE --> ASSIGN[Reviewer Assignment]
ASSIGN --> EVAL[Evaluation]
~~~

Sampling logic must be reproducible enough to explain why a conversation was selected.

## 7. Evaluation Lifecycle

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

The exact state set can evolve, but completed evaluations should not be silently rewritten.

## 8. Evidence

Every important finding should point to evidence.

Evidence can reference:

- conversation message;
- tool invocation;
- AI run step;
- policy decision;
- workflow step;
- customer outcome;
- provider delivery event.

A reviewer should be able to answer:

~~~text
Why did this criterion receive this result?
What evidence supports it?
Which version of the scorecard was used?
Who reviewed it?
~~~

## 9. Human vs AI Evaluation

AI can propose evaluation findings.

It should not automatically become authoritative for high-impact quality records unless the quality policy explicitly permits it.

Conceptual flow:

~~~mermaid
sequenceDiagram
participant Q as Sampling
participant AI as AI Evaluator
participant H as Human Reviewer
participant DB as Quality DB
Q->>AI: Evaluation case
AI-->>Q: Proposed findings
Q->>H: Review case
H-->>DB: Accepted / corrected evaluation
DB-->>Q: Final quality result
~~~

## 10. Calibration

Reviewers may disagree because criteria are ambiguous.

Calibration sessions compare:

- same conversation;
- same scorecard version;
- different reviewers;
- evidence basis;
- final adjudication.

Store rubric version and adjudication outcome.

Do not hide systematic disagreement by averaging scores blindly.

## 11. Critical Findings

Some findings should trigger actions independent of average score:

- data leakage;
- unauthorized tool use;
- false financial/customer action claim;
- prohibited content;
- missed mandatory escalation;
- security-policy breach.

Critical findings can start a workflow for remediation or incident review.

## 12. Remediation

A quality finding may create:

- coaching task;
- knowledge correction;
- prompt update;
- routing policy change;
- guardrail update;
- workflow adjustment;
- training case;
- engineering defect.

The remediation reference should preserve causality:

~~~text
Conversation
 -> Evaluation
   -> Finding
     -> Remediation
       -> Change
~~~

## 13. Appeals and Corrections

A reviewer correction should preserve the prior record rather than deleting history.

Possible pattern:

~~~text
evaluation v1 submitted
evaluation correction v2
final adjudication
~~~

The implementation may instead use immutable events/version records.

## 14. Cross-Domain Contracts

**Conversations:** provides evidence and operational outcome.

**Workforce:** supplies agent/team identity for evaluation.

**AI:** AI runs and policies become evaluation dimensions.

**Routing:** routing quality can be measured from assignment/SLA outcomes.

**Knowledge:** grounding findings can reference source/document versions.

**Tools:** incorrect tool calls become findings.

**Workflows:** remediation can create workflow tasks.

## 15. Failure Modes

| Failure | Behavior |
|---|---|
| scorecard invalid | do not publish |
| scorecard changed during review | evaluation keeps original version |
| reviewer loses scope | evaluation becomes inaccessible until reassigned |
| evidence deleted by retention | preserve allowed evidence metadata/reference state |
| AI evaluator unavailable | queue for human review |
| duplicate sampling trigger | one evaluation assignment for same sampling event |

## 16. Observability

Track:

- sample rate;
- evaluation backlog;
- evaluation SLA;
- reviewer workload;
- critical finding rate;
- disagreement rate;
- remediation closure time;
- quality by team/program/channel;
- AI vs human quality dimensions.

## 17. Acceptance Criteria

- Completed evaluations retain immutable scorecard version.
- Every important score has explainable evidence.
- Sampling can be explained.
- AI evaluations can remain proposals.
- Critical findings can trigger remediation.
- Reviewer corrections preserve history.
- Quality data is tenant/scope isolated.
