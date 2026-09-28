# Data Retention

> Status: **Target / normative engineering design**.

Retention is data-class specific and based on product, contractual, security, operational and legal needs.

## Contract

Conversation history is tenant-configurable; audit data is long-lived; raw provider webhook payloads are operationally retained; AI traces should have shorter/privacy-aware retention; billing records follow financial obligations; logs have short raw retention and longer aggregated metrics. Deletion must propagate to derived indexes and caches.

## Mermaid Flow

```mermaid
flowchart LR
DATA[Source Data] --> ACTIVE[Active Retention]
ACTIVE --> ARCH[Archive / Reduced Access]
ARCH --> PURGE[Delete]
PURGE --> DERIVED[Derived Index Cleanup]
BACKUP[Backups] -. expire by policy .-> PURGE
```

## Engineering Rule

The design must fail closed on authorization, preserve tenant scope, make retries safe, and expose enough telemetry to diagnose production behavior.
