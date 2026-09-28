# ADR-0001: Modular Monolith First

> Status: **Accepted**

## Context

OMILINKS has many domains but the implementation is currently a scaffold. Premature microservice distribution would multiply network, deployment, consistency and debugging complexity before there is evidence that service boundaries need independent deployment.

## Decision

Implement the initial system as a modular monolith with explicit domain/application/infrastructure boundaries and durable asynchronous workers.

~~~mermaid
flowchart LR
API[API] --> APP[Application]
APP --> DOMAIN[Domains]
DOMAIN --> DB[(PostgreSQL)]
DOMAIN --> OUTBOX[Outbox]
OUTBOX --> WORK[Workers]
WORK --> AI[AI]
WORK --> INT[Integrations]
~~~

## Consequences

Positive:

- simpler transactions;
- easier tenant-isolation proof;
- one deployment topology;
- faster early iteration.

Negative:

- module boundaries require discipline;
- shared runtime can create noisy-neighbor risk;
- later extraction requires preserving contracts.

## Extraction Trigger

Extract a module only when measurable evidence exists:

~~~text
independent scaling requirement
+
failure isolation requirement
+
team ownership boundary
+
stable API/event contract
~~~
