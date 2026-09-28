# Migration Policy

> Status: **Target / normative engineering design**.

Database changes are deployed using compatibility-first migration patterns.

## Contract

Prefer additive migrations, deploy compatible code, backfill in bounded batches, switch reads/writes, then remove obsolete structures later. Estimate locks and query impact. Destructive/external mutations require compensating procedures, not assumptions about transaction rollback.

## Mermaid Flow

```mermaid
sequenceDiagram
participant DEV as Engineering
participant CI
participant DB as PostgreSQL
participant APP as New App
DEV->>CI: Migration compatibility tests
CI-->>DEV: Pass
DEV->>DB: Additive change
DEV->>APP: Compatible release
APP->>DB: Backfill / switch
DEV->>DB: Later cleanup
```

## Engineering Rule

The design must fail closed on authorization, preserve tenant scope, make retries safe, and expose enough telemetry to diagnose production behavior.
