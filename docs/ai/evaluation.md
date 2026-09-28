# AI Evaluation — Implementation Specification

> Status: **Target evaluation platform blueprint**

AI quality is a property of the complete execution path, not model text alone.

## 1. Evaluation Target

~~~text
model
+ prompt version
+ routing policy
+ retrieved knowledge
+ tool versions
+ guardrails
+ workflow
+ channel
~~~

Changing any component can change behavior.

## 2. Evaluation Layers

1. unit evaluation of deterministic logic;
2. offline dataset evaluation;
3. scenario evaluation with retrieval/tools;
4. human review;
5. production sampling;
6. regression corpus growth.

## 3. Case Contract

~~~json
{
  "caseId": "case_001",
  "datasetVersion": "v12",
  "taskType": "billing_question",
  "input": {},
  "expectedBehavior": {},
  "allowedTools": [],
  "knowledgeSnapshot": "kb-v4",
  "riskTier": "medium",
  "expectedOutcome": "resolved"
}
~~~

## 4. Reproducibility

Pin:

- model profile version;
- prompt version;
- routing policy version;
- agent policy version;
- knowledge snapshot;
- tool versions;
- guardrail version;
- dataset version.

A score without these references is not reliably reproducible.

## 5. Evaluation Pipeline

~~~mermaid
flowchart TD
DATA[Versioned Dataset] --> CASE[Evaluation Case]
CASE --> RUN[Evaluation Runner]
RUN --> ROUTE[Model Router]
RUN --> KNOW[Knowledge Snapshot]
RUN --> TOOLS[Sandbox Tools]
ROUTE --> SCORE[Scoring]
KNOW --> SCORE
TOOLS --> SCORE
SCORE --> HARD[Hard Safety Checks]
HARD --> HUMAN[Human Review]
HUMAN --> GATE[Regression Gate]
SCORE --> GATE
GATE --> RELEASE[Release Candidate]
RELEASE --> SAMPLE[Production Sampling]
SAMPLE --> NEWCASE[Regression Case]
NEWCASE --> DATA
~~~

## 6. Quality Dimensions

| Dimension | Question |
|---|---|
| correctness | Is the fact/action correct? |
| grounding | Are claims supported by authorized evidence? |
| tool accuracy | Was the tool/argument/result handling correct? |
| safety | Were authorization and policy preserved? |
| conversation quality | Was the interaction useful and clear? |
| operational outcome | Was the task resolved/handoff/failed? |
| cost | Was resource usage acceptable? |

Do not compress all dimensions into one number.

## 7. Hard Safety Gates

Automatic failure includes:

- cross-tenant exposure;
- unauthorized tool execution;
- destructive action without authorization;
- fabricated successful external action;
- critical guardrail regression;
- suppressed required handoff.

Average quality cannot mask a hard safety failure.

## 8. Baseline Comparison

Candidate changes are evaluated against a pinned baseline using the same dataset and configuration assumptions.

Report:

- absolute metrics;
- delta from baseline;
- failed cases;
- new regressions;
- repaired regressions.

## 9. Human Evaluation

Reviewers use versioned rubrics.

Record:

- rubric version;
- reviewer;
- evidence;
- decision;
- adjudication.

Persistent disagreement should trigger rubric improvement.

## 10. Production Sampling

Bias sampling toward:

- handoffs;
- policy blocks;
- tool calls;
- provider fallback;
- unusual cost;
- customer dissatisfaction;
- errors;
- rare channels.

Sampling only successful conversations produces survivorship bias.

## 11. Regression Case Promotion

~~~mermaid
flowchart LR
INC[Production Failure] --> REPRO[Minimal Reproduction]
REPRO --> LABEL[Expected Behavior]
LABEL --> DATASET[Dataset Version]
DATASET --> CI[Automated Regression]
CI --> RELEASE[Release Gate]
~~~

A resolved production failure becomes a permanent regression case.

## 12. Tool Sandbox

Evaluation tools must not create real customer effects during ordinary CI.

Use simulated effects or provider sandboxes.

## 13. Privacy

Production traces used for evaluation are:

- minimized;
- redacted;
- access-controlled;
- retention-bound.

## 14. Evaluation Observability

Every evaluation emits:

- case ID;
- dataset version;
- model/configuration versions;
- execution result;
- failure reasons;
- latency;
- usage.

## 15. Acceptance

An evaluation system is production-grade when a change can be reproduced, compared against a baseline, blocked for hard safety regression and converted into durable test coverage.