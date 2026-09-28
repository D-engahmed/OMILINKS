# Telegram Integration — Implementation Specification

> Status: **Target provider-adapter blueprint**

## 1. Boundary

TelegramAdapter owns bot authentication, webhook/update parsing, chat semantics and provider delivery.

Core Conversation and Customer domains receive canonical commands.

## 2. Connection

~~~text
organization_id
bot_id
credential_ref
webhook_config
status
capabilities
health
~~~

## 3. Update Dedupe

Provider update identity becomes the first dedupe key.

~~~mermaid
flowchart LR
UPDATE[Telegram Update] --> DEDUPE[Update ID Constraint]
DEDUPE --> IDENTITY[Bot + Chat + User]
IDENTITY --> MESSAGE[Canonical Message]
MESSAGE --> ROUTE[Routing]
~~~

A duplicate update must not produce another message.

## 4. Chat Semantics

Preserve chat type:

~~~text
private
group
other supported type
~~~

Product policy decides which types can enter customer-support conversations.

Unsupported types become explicit unsupported events.

## 5. Identity Scope

~~~text
organization
+ bot
+ external user/chat identity
~~~

Provider user IDs are not global customer IDs.

## 6. Outbound

~~~mermaid
sequenceDiagram
participant C as Conversation
participant Q as Worker
participant A as Telegram Adapter
participant P as Telegram
C->>Q: Delivery job
Q->>A: Send
A->>P: Provider call
P-->>A: Result
A-->>Q: Normalized result
Q->>C: Delivery state
~~~

## 7. Media

Media download is asynchronous.

Persist provider media ID and processing state before download.

## 8. Reliability

- rate limits -> scheduled retry;
- timeout -> reconcile if outcome is unknown;
- invalid token -> connection degraded;
- malformed update -> quarantine.

## 9. Security

Bot credentials never enter browser, model or event payload.

The organization binding comes from the integration connection.

## 10. Tests

- duplicate update;
- malformed update;
- private chat;
- unsupported chat;
- media;
- send timeout;
- rate limit;
- invalid token;
- tenant isolation.

## 11. Observability

Measure update throughput, duplicate rate, provider latency, token health, queue age, unsupported events and delivery failures.

## 12. Acceptance

Telegram is complete when update dedupe, chat semantics, credential isolation and delivery uncertainty are handled explicitly.
