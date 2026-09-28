# Model Routing

> Status: **Target / normative engineering design**.

Select compatible models using task capability, tenant policy, provider health, latency, quality, and cost.

## Contract

Filter unsupported models, then tenant-disallowed models, then unhealthy providers; apply budget checks; rank by configured policy; define compatible fallback. Routing decisions are versioned and observable.

## Mermaid Flow

```mermaid
flowchart TD
TASK[Task] --> CAP[Capability]
CAP --> TEN[Tenant Policy]
TEN --> HEALTH[Provider Health]
HEALTH --> COST[Budget]
COST --> RANK[Policy Ranking]
RANK --> MODEL[Model]
MODEL --> FALL[Compatible Fallback]
```

## Engineering Rule

External inputs are untrusted, tenant scope is mandatory, and side effects require explicit authorization and idempotency where duplicate execution could matter.
