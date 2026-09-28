# Facebook Messenger Integration

> Status: **Target / normative engineering design**.

Use Page-scoped configuration and canonical conversations while retaining Facebook page/thread/message identifiers for reconciliation.

## Contract

Invalid webhook verification produces no mutation. Outbound failures update delivery state instead of rewriting message history.

## Mermaid Flow

```mermaid
flowchart LR
P[Facebook] --> V[Verify]
V --> N[Normalize]
N --> C[Conversation]
C --> R[Routing]
R --> S[Send Adapter]
```

## Engineering Rule

External inputs are untrusted, tenant scope is mandatory, and side effects require explicit authorization and idempotency where duplicate execution could matter.
