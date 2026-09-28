# Architecture Decision Records

> Status: **Target decision index**

This directory records durable architectural decisions.

## Current ADRs

| ADR | Decision |
|---|---|
| 0001 | Modular monolith first |
| 0002 | PostgreSQL as transactional source of truth |
| 0003 | Transactional outbox + at-least-once events |
| 0004 | Tenant isolation at repository boundary |
| 0005 | AI cannot bypass Tool/Domain boundaries |

## ADR Rules

An ADR is required when a change affects:

- core architecture;
- data source of truth;
- consistency model;
- tenant security model;
- major integration boundary;
- AI authority model;
- deployment topology.

## Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> PROPOSED
    PROPOSED --> ACCEPTED
    PROPOSED --> REJECTED
    ACCEPTED --> SUPERSEDED
    ACCEPTED --> DEPRECATED
~~~

Accepted ADRs remain historical even when superseded.

## Review Principle

Do not silently change architectural assumptions in code. Update or supersede the ADR.
