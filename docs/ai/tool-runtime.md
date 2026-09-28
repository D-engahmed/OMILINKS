# AI Tool Runtime

> Status: **Target / normative engineering design**.

Tools are the controlled action plane between AI and business/external systems. Models never receive raw credentials and never directly mutate the database.

## Contract

Validate schema -> authorize -> check entitlement -> resolve credential -> execute with timeout/idempotency -> sanitize result -> audit. High-impact tools can require durable human approval.

## Mermaid Flow

```mermaid
sequenceDiagram
participant M as Model
participant P as Policy
participant V as Validator
participant T as Tool Runtime
participant D as Domain
M->>P: Tool intent
P-->>M: Allow
M->>V: Args
V->>T: Valid
T->>D: Execute
D-->>T: Result
T-->>M: Sanitized result
```

## Engineering Rule

External inputs are untrusted, tenant scope is mandatory, and side effects require explicit authorization and idempotency where duplicate execution could matter.
