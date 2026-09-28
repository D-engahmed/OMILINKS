# AI Guardrails

> Status: **Target / normative engineering design**.

Guardrails cover input, context, tool access, output, action approval, and budget.

## Contract

Security/authorization constraints outrank prompts. Retrieved documents and tool outputs are untrusted. On policy violation or uncertainty, stop autonomous action, respond safely, or hand off.

## Mermaid Flow

```mermaid
flowchart LR
IN[Input] --> CTX[Context Policy]
CTX --> M[Model]
M --> OUT[Output Policy]
OUT --> TOOL[Tool Policy]
TOOL --> ACT[Action / Handoff]
```

## Engineering Rule

External inputs are untrusted, tenant scope is mandatory, and side effects require explicit authorization and idempotency where duplicate execution could matter.
