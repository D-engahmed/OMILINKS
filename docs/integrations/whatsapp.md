# WhatsApp Integration

> Status: **Target / normative engineering design**.

Normalize verified WhatsApp events into canonical customer, conversation, message, attachment, and delivery facts. Keep provider identifiers alongside internal IDs.

## Contract

Webhook verification -> durable ingest -> normalize -> route -> human/AI -> send -> delivery status

Provider outage must degrade only WhatsApp, not the whole conversation system.

## Mermaid Flow

```mermaid
sequenceDiagram
participant P as WhatsApp
participant A as Adapter
participant DB as Core DB
participant W as Worker
P->>A: Signed webhook
A->>DB: Durable event + dedupe
A->>W: Async processing
W->>DB: Canonical message
W->>A: Send when required
```

## Engineering Rule

External inputs are untrusted, tenant scope is mandatory, and side effects require explicit authorization and idempotency where duplicate execution could matter.
