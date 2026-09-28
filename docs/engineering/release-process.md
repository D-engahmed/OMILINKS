# Release Process

> Status: **Target / normative engineering design**.

Production releases are controlled changes with validation and rollback awareness.

## Contract

Pipeline: install from lockfile -> lint/format -> typecheck -> tests -> build immutable artifact -> migration compatibility -> staging -> smoke tests -> production -> monitor. Rollback must respect database compatibility; disablement/forward fix can be safer than blind code rollback.

## Mermaid Flow

```mermaid
flowchart TD
CHANGE[Change] --> CI[CI]
CI --> STAGE[Staging]
STAGE --> SMOKE[Smoke]
SMOKE --> PROD[Production]
PROD --> MON[Monitor]
MON -->|Healthy| DONE[Complete]
MON -->|Unhealthy| MIT[Mitigate / Rollback]
```

## Engineering Rule

The design must fail closed on authorization, preserve tenant scope, make retries safe, and expose enough telemetry to diagnose production behavior.
