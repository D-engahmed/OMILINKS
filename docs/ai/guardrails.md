# AI Guardrails — Implementation Specification

> Status: **Target security/runtime blueprint**

Guardrails are independent enforcement layers around model generation. Prompt instructions alone are not security controls.

## 1. Trust Hierarchy

~~~text
platform security policy
> domain authorization
> tenant policy
> agent policy
> workflow policy
> model instruction
> customer/document/tool content
~~~

Lower-trust content can provide facts but cannot redefine higher-trust policy.

## 2. Guardrail Pipeline

~~~mermaid
flowchart LR
IN[External Input] --> CLASSIFY[Classify Risk + Data]
CLASSIFY --> CONTEXT[Authorized Context]
CONTEXT --> MODEL[Model]
MODEL --> SCHEMA[Output Schema Validation]
SCHEMA --> SAFETY[Safety Policy]
SAFETY --> GROUND[Grounding / Claim Checks]
GROUND --> TOOL[Tool Authorization]
TOOL --> ACTION[Action Policy]
ACTION -->|allow| SIDE[Side Effect]
ACTION -->|block| BLOCK[Block]
ACTION -->|handoff| HUMAN[Human Handoff]
~~~

## 3. Prompt Injection

Treat customer messages, documents and tool outputs as data.

Defenses:

- isolate system/tenant instructions from untrusted content;
- label retrieved content as untrusted;
- never derive authorization from text;
- use tool allowlists;
- validate tool arguments outside the model;
- regression-test direct and indirect injection.

## 4. Context Security

Context eligibility is:

~~~text
candidate data
INTERSECT tenant scope
INTERSECT resource permission
INTERSECT agent context policy
INTERSECT retention/visibility policy
~~~

Retrieval must enforce this before model exposure.

## 5. Output Validation

Validate:

- required schema;
- allowed enum values;
- response size;
- prohibited data classes;
- unsupported claims;
- action claims against authoritative tool results.

Example:

~~~text
model says: refund completed
tool result: refund pending
authoritative state: pending
~~~

The model statement is not sufficient evidence of completion.

## 6. Risk Tiers

| Tier | Example | Control |
|---|---|---|
| low | FAQ response | autonomous |
| medium | ticket creation | policy controlled |
| high | account mutation | approval/strict policy |
| critical | irreversible action | human approval |

Risk is an execution input, not a model confidence score.

## 7. Autonomy Limits

Every run can be bounded by:

- maximum steps;
- maximum tool calls;
- maximum repeated call count;
- deadline;
- cost budget;
- token budget;
- valid conversation control version.

~~~mermaid
flowchart TD
RUN[AI Run] --> STEP[Step Counter]
RUN --> CALLS[Tool Counter]
RUN --> COST[Cost Counter]
RUN --> DEADLINE[Deadline]
RUN --> CONTROL[Control Version]
STEP --> LIMIT{Limit Reached?}
CALLS --> LIMIT
COST --> LIMIT
DEADLINE --> LIMIT
CONTROL --> LIMIT
LIMIT -->|yes| STOP[Stop / Handoff]
LIMIT -->|no| CONTINUE[Continue]
~~~

## 8. Handoff Conditions

Handoff can be required by:

- explicit customer request;
- high-risk action;
- low-confidence policy condition;
- unsupported capability;
- repeated failure;
- policy violation;
- SLA risk;
- customer dissatisfaction;
- budget exhaustion.

The model cannot veto a required handoff.

## 9. Guardrail Decision Contract

~~~json
{
  "decision": "allow|transform|block|handoff",
  "policyVersion": 7,
  "riskTier": "high",
  "reasons": ["approval_required"],
  "checks": ["tenant_scope", "tool_policy", "output_policy"]
}
~~~

High-risk decisions are persisted.

## 10. Dependency Failure

| Operation | Behavior |
|---|---|
| low-risk conversation | degrade only if explicitly allowed |
| medium-risk action | safer fallback/handoff |
| high-risk action | fail closed |
| critical action | fail closed |

Safety must not be silently disabled because a dependency is unavailable.

## 11. Required Adversarial Tests

- direct prompt injection;
- indirect injection in knowledge;
- malicious tool result;
- unauthorized resource request;
- secret extraction attempt;
- fabricated action success;
- restricted output data;
- infinite tool loop;
- suppressed mandatory handoff;
- guardrail dependency outage;
- stale control version.

## 12. Observability

Record or measure:

- rule/policy version;
- decision;
- reason category;
- risk tier;
- latency;
- run/tool correlation;
- block/handoff rate;
- regression case ID where applicable.

## 13. Acceptance

A guardrail implementation is complete only when bypass attempts have preventive controls, automated regression tests and an observable security signal.