# OmniLinks Channel Architecture

## Principle

Channel providers are adapters around a channel-neutral core.

Business logic must not branch throughout the system on vendor names.

## Adapter contract

A channel adapter supports:
- webhook verification
- inbound normalization
- outbound sending
- media retrieval where supported
- provider delivery mapping
- provider error mapping

## Inbound path

    provider webhook
      -> signature validation
      -> deduplication
      -> durable inbound event
      -> normalization
      -> customer identity resolution
      -> conversation resolution
      -> automation
      -> routing
      -> AI/human/workflow

## Outbound path

    normalized message
      -> channel adapter
      -> provider API
      -> delivery event
      -> message delivery state

## First channel families

Web:
- owned widget/embed
- reference implementation for normalized messages

WhatsApp:
- business messaging connection
- provider delivery states and messaging policy handled by adapter

Telegram:
- bot connection

Instagram/Facebook:
- Meta messaging adapters

SMS:
- provider adapter with delivery tracking

Voice:
- later channel family with call state, media and recording semantics

## Channel connection

Fields should include:
- organization
- provider
- channel type
- status
- configuration reference
- credential reference
- optional client/program/sector scope

Credential values are encrypted.

## Normalized message

The internal message contract should include:
- id
- organizationId
- conversationId
- channelConnectionId
- externalMessageId
- direction
- sender
- recipient
- content
- attachments
- occurredAt
- receivedAt
- deliveryStatus
- correlationId

## Delivery states

Normalized states:
- accepted
- queued
- sent
- delivered
- read
- failed
- unknown

Provider acceptance does not mean customer delivery.

## Identity resolution

Resolve in order:
1. deterministic provider identity
2. tenant-configured matching rule
3. high-confidence candidate
4. review/merge candidate
5. separate customer

Do not automatically merge uncertain matches.

## Reliability

Webhooks and outbound delivery need:
- idempotency
- retry classification
- backoff
- timeouts
- durable state
- dead-letter/recovery handling

## New channel definition of done

- adapter implementation
- credential lifecycle
- webhook verification
- inbound normalization
- outbound mapping
- delivery event handling
- idempotency tests
- integration tests
- monitoring
- documentation
