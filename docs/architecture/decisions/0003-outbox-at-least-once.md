# ADR-0003: Transactional Outbox and At-Least-Once Events

> Status: **Accepted**

## Context

A business transaction and event publication can fail independently.

## Decision

Persist business state and outbox event in the same database transaction; publish asynchronously; assume at-least-once delivery.

~~~mermaid
sequenceDiagram
participant APP as Application
participant DB as PostgreSQL
participant O as Outbox
participant BUS as Event Bus
APP->>DB: Begin
APP->>DB: Business mutation
APP->>O: Event
DB-->>APP: Commit
O->>BUS: Publish
BUS-->>O: Ack
~~~

Consumers are idempotent.

## Consequences

- no distributed transaction is required;
- delivery can be delayed;
- duplicates are expected;
- event schemas must be versioned;
- dead-letter/replay operations are required.
