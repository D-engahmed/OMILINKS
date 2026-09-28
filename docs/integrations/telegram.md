# Telegram Integration

> Status: **Target production integration contract**

## 1. Purpose

Connect Telegram bots to the canonical OMILINKS customer and conversation system while preserving Telegram chat/update semantics.

## 2. Bot Connection

Store:

- organization;
- bot identity;
- credential reference;
- webhook configuration;
- status;
- supported chat/message capabilities;
- health timestamps.

Lifecycle:

~~~mermaid
stateDiagram-v2
    [*] --> CONFIGURING
    CONFIGURING --> ACTIVE
    CONFIGURING --> FAILED
    ACTIVE --> DEGRADED
    DEGRADED --> ACTIVE
    ACTIVE --> DISCONNECTED
~~~

## 3. Update Processing

Use provider update identity to deduplicate.

~~~mermaid
flowchart LR
UPDATE[Telegram Update] --> DEDUPE[Dedupe update]
DEDUPE --> IDENTITY[Bot + Chat + User Mapping]
IDENTITY --> MESSAGE[Canonical Message]
MESSAGE --> ROUTE[Routing]
ROUTE --> AIHUMAN[AI / Human]
AIHUMAN --> SEND[Outbound Adapter]
~~~

## 4. Chat Semantics

Preserve provider chat type.

Potential classes include:

- direct/private;
- group;
- other provider-supported chat modes.

The product may restrict supported modes. Unsupported modes must become an explicit integration state instead of being silently treated as ordinary customer conversations.

## 5. Identity

Identity is scoped by:

~~~text
organization
+ bot
+ provider user/chat identity
~~~

A Telegram user ID should never be treated as globally unique across all tenants and bots.

## 6. Outbound Delivery

~~~mermaid
sequenceDiagram
    participant C as Conversation
    participant Q as Worker
    participant A as Telegram Adapter
    participant P as Telegram
    C->>Q: Delivery job
    Q->>A: Send canonical message
    A->>P: Provider API
    P-->>A: Result
    A-->>Q: Normalized status
    Q->>C: Persist delivery state
~~~

## 7. Media

Provider media IDs can be retained for later retrieval.

Media download/processing should be asynchronous and bounded by size/type policies.

## 8. Reliability

Provider throttling becomes scheduled retry work.

For unknown side-effect outcomes, reconcile before repeating the operation if duplicate customer-visible action is possible.

## 9. Failure Modes

| Failure | Behavior |
|---|---|
| duplicate update | no duplicate business state |
| malformed update | quarantine |
| invalid token | connection error |
| rate limit | scheduled retry |
| provider timeout | reconcile |
| unsupported chat type | explicit unsupported state |
| media processing failure | attachment failure state |

## 10. Security

- bot tokens remain server-side;
- organization binding is server-derived;
- webhook configuration is controlled server-side;
- raw credentials never enter events/logs/model context.

## 11. Observability

Monitor:

- update throughput;
- duplicate rate;
- outbound latency;
- API errors;
- token health;
- queue age;
- unsupported events;
- media failures.

## 12. Testing

- valid update;
- duplicate update;
- malformed update;
- private chat mapping;
- supported media;
- unsupported chat;
- outbound success/failure;
- rate limiting;
- timeout;
- credential revocation;
- tenant isolation.

## 13. Acceptance Criteria

- Update identity prevents duplicate business state.
- Chat semantics are preserved.
- Unsupported modes fail explicitly.
- Bot credentials remain server-side.
- Provider degradation is isolated to Telegram.
