# ADR-0002: PostgreSQL as Transactional Source of Truth

> Status: **Accepted**

## Context

Customer operations require strong relational integrity across tenant, conversation, assignment, workflow and billing state.

## Decision

PostgreSQL owns transactional business state. Search/vector, cache and analytics stores are derived.

~~~mermaid
flowchart LR
DOMAIN[Domain] --> PG[(PostgreSQL)]
PG --> OUTBOX[Outbox]
OUTBOX --> DERIVED[Derived Systems]
DERIVED --> SEARCH[Search]
DERIVED --> ANALYTICS[Analytics]
DERIVED --> CACHE[Cache]
~~~

## Consequences

- relational constraints protect core invariants;
- derived systems can be rebuilt;
- analytical scale can evolve independently;
- event-driven projections must handle lag.

## Rejected Alternative

Making the vector store or analytics system the source of customer/business truth would create authorization/freshness risks.
