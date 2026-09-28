# Data Retention — Implementation Specification

> Status: **Target production data lifecycle blueprint**

Retention is defined by data class and purpose.

## 1. Retention Classes

| Class | Access | Lifecycle |
|---|---|---|
| security/audit | restricted | long-lived |
| billing/payment | restricted | financial retention |
| conversations | tenant policy | operational retention |
| customer PII | restricted | purpose/retention bound |
| raw webhooks | limited | short operational window |
| AI traces | restricted | shortest useful window where practical |
| knowledge sources | business-defined | until deleted/retention boundary |
| embeddings/index | derived | removed with source |
| logs | operational | short raw retention |

Exact durations are policy/configuration, not hardcoded into application logic.

## 2. Retention Metadata

Records that require controlled purge can carry:

~~~text
retention_class
retention_until
deleted_at
legal_hold
purge_status
~~~

## 3. Lifecycle Pipeline

~~~mermaid
flowchart LR
ACTIVE[Active Record] --> EXPIRING[Near Retention]
EXPIRING --> ARCHIVE[Archive/Restricted]
ARCHIVE --> PURGE[Canonical Purge]
PURGE --> DERIVED[Derived Store Cleanup]
BACKUP[Backups] --> BACKUPEXP[Backup Expiry]
~~~

## 4. Logical vs Physical Delete

Logical delete:

~~~text
record inaccessible
record marked deleted
derived cleanup queued
~~~

Physical deletion:

~~~text
remove canonical row/object
cleanup indexes/cache
respect backup expiry
~~~

## 5. Deletion Ordering

Canonical state changes first.

~~~text
canonical delete
 -> deny future reads
 -> remove from search/vector
 -> remove object storage
 -> cleanup projections
 -> backup expires later
~~~

A stale index must not resurrect deleted data.

## 6. AI Trace Retention

AI traces may contain:

- customer content;
- retrieved knowledge;
- tool output;
- model output.

Therefore tracing policies distinguish:

~~~text
metadata retained longer
raw content retained shorter
~~~

Where operationally safe, store hashes/references instead of duplicate raw content.

## 7. Legal Hold

A legal hold blocks eligible purge operations.

~~~mermaid
stateDiagram-v2
    [*] --> RETAINING
    RETAINING --> EXPIRING
    EXPIRING --> HOLD
    HOLD --> RETAINING
    EXPIRING --> PURGED
    RETAINING --> PURGED
~~~

## 8. Backup Interaction

Deleting primary data does not immediately delete copies in backup.

Backup retention is separate.

A restore must reapply current authorization boundaries.

## 9. Tenant Configuration

Tenant retention settings must be constrained by platform policy.

A tenant cannot choose a retention period that violates required security/financial/platform controls.

## 10. Purge Jobs

Purge jobs are:

- tenant-aware;
- resumable;
- rate limited;
- observable;
- idempotent;
- auditable.

## 11. Failure Modes

| Failure | Behavior |
|---|---|
| purge worker crash | retry |
| object cleanup failure | retain purge backlog + alert |
| index cleanup failure | canonical block remains |
| legal hold | skip purge |
| invalid retention configuration | reject |
| partial purge | resume from durable checkpoint |

## 12. Tests

- deletion blocks read;
- index cannot return deleted record;
- legal hold;
- purge retry;
- cross-tenant purge;
- retention configuration validation.

## 13. Acceptance

Retention is complete when deletion, archival, derived cleanup, backup interaction and legal hold semantics are durable and testable.
