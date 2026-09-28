# AI Model Routing — Implementation Specification

> Status: **Target implementation blueprint**

Routing selects a provider/model only after hard compatibility and policy constraints have removed invalid candidates.

## 1. Responsibilities

- task normalization;
- candidate discovery;
- hard filtering;
- candidate scoring;
- deterministic tie breaking;
- provider health state;
- fallback selection;
- route decision persistence.

Execution remains the responsibility of the model runtime/provider adapter.

## 2. Normalized Task Contract

~~~json
{
  "taskType": "customer_response",
  "organizationId": "org_123",
  "agentId": "agent_7",
  "language": "ar-EG",
  "contextTokens": 12000,
  "requiredCapabilities": ["tool_calling", "structured_output"],
  "riskTier": "medium",
  "deadlineMs": 5000,
  "remainingBudgetUsd": 0.42
}
~~~

Routing decisions must be driven by structured task requirements rather than prompt-text guessing.

## 3. Model Profile

Each enabled model has:

- provider_id;
- model_id;
- profile_version;
- context_window;
- modality set;
- tool calling support;
- structured output support;
- language capability metadata;
- expected latency class;
- quality tier;
- price version;
- data handling class;
- health state.

## 4. Candidate Pipeline

~~~mermaid
flowchart TD
TASK[Normalized Task] --> TENANT[Tenant Model Policy]
TENANT --> CAP[Capability Filter]
CAP --> CTX[Context Capacity]
CTX --> RISK[Risk Policy]
RISK --> DATA[Data Handling Policy]
DATA --> BUDGET[Budget / Entitlement]
BUDGET --> HEALTH[Provider Health]
HEALTH --> SET[Eligible Candidates]
SET --> SCORE[Score Candidates]
SCORE --> TIE[Deterministic Tie Break]
TIE --> DECISION[Route Decision]
~~~

Hard filters happen before scoring.

## 5. Rejection Reasons

- TENANT_DENIED;
- CAPABILITY_MISSING;
- CONTEXT_TOO_LARGE;
- RISK_NOT_ALLOWED;
- DATA_POLICY_VIOLATION;
- ENTITLEMENT_DENIED;
- BUDGET_EXCEEDED;
- PROVIDER_UNHEALTHY;
- MODEL_DISABLED.

## 6. Scoring Contract

~~~text
score =
  quality_weight * quality_score
  + reliability_weight * reliability_score
  + latency_weight * latency_score
  - cost_weight * normalized_cost
~~~

All weights and normalization rules belong to a versioned routing policy.

## 7. Deterministic Tie Breaking

Final ties should use stable ordering such as:

~~~text
provider_id ASC
model_id ASC
profile_version ASC
~~~

Do not use random selection when reproducibility matters.

## 8. Decision Record

~~~json
{
  "decisionId": "uuid",
  "routingPolicyVersion": 4,
  "candidateSnapshotVersion": 2,
  "candidates": [],
  "selectedProvider": "provider-a",
  "selectedModel": "model-x",
  "createdAt": "..."
}
~~~

Store enough evidence to explain a route without storing unnecessary prompt content.

## 9. Provider Health

Health derives from timeout rate, 5xx rate, 429 rate, latency percentiles, structured-output failures and tool-call failures.

~~~mermaid
stateDiagram-v2
    [*] --> HEALTHY
    HEALTHY --> DEGRADED
    DEGRADED --> OPEN
    OPEN --> HALF_OPEN
    HALF_OPEN --> HEALTHY
    HALF_OPEN --> OPEN
~~~

Semantics:

~~~text
HEALTHY   -> normal candidate pool
DEGRADED  -> reduced route weight
OPEN      -> excluded
HALF_OPEN -> limited probe
~~~

## 10. Fallback Compatibility

Fallback must preserve hard requirements.

~~~text
tool_calling + structured_output task
 -> alternate model with both capabilities
~~~

An incompatible model is not a fallback merely because it is available.

## 11. Retry vs Fallback

| Failure | Retry | Fallback |
|---|---|---|
| transient timeout | bounded | after retry policy |
| 429 | provider-aware | alternate eligible candidate |
| temporary 5xx | bounded | alternate eligible candidate |
| local schema error | no | no |
| capability mismatch | no | compatible candidate |
| tenant policy denial | no | another allowed candidate only |

## 12. Data Handling

Provider candidates are filtered by the data classification they are allowed to receive.

Example:

~~~text
task classification = confidential
provider policy = public-only
-> candidate rejected
~~~

This check occurs before the request is constructed.

## 13. Budget Preflight

Preflight estimates include expected input tokens, output allowance, likely tool calls and provider price version.

The estimate controls admission. Actual usage is recorded after execution.

## 14. Cache Safety

Safe cache candidates include model profiles, provider health snapshots and immutable routing policies.

Tenant-sensitive route decisions must include every security-relevant input in the cache key.

## 15. Reproducibility

Persist:

- task normalization version;
- routing policy version;
- model profile versions;
- provider health snapshot;
- budget snapshot;
- candidate rejection reasons;
- selected route.

## 16. Test Matrix

- no compatible model;
- one candidate;
- capability mismatch;
- tenant allowlist;
- risk-tier exclusion;
- provider circuit open;
- circuit recovery;
- exact score tie;
- budget nearly exhausted;
- structured-output fallback;
- tool-call fallback;
- Arabic capability requirement;
- data-policy rejection.

## 17. Acceptance

A route is production-grade when it is explainable, reproducible from its input snapshot, policy-compliant, cost-aware and contract-compatible.