# Data Retention

> Status: **Target production data lifecycle contract**

Retention controls how long OMILINKS stores, exposes and physically deletes each data class.

Retention is not one global number.

## 1. Data Classes

| Data class | Typical treatment |
|---|---|
| audit/security events | long retention |
| conversation messages | tenant/configurable retention |
| customer PII | configurable + privacy requirements |
| raw provider webhooks | short/medium operational retention |
| AI traces | restricted, privacy-aware retention |
| knowledge sources | until disabled/deleted + policy |
| embeddings/indexes | derived; delete with source policy |
| usage records | financial/operational retention |
| payment records | financial retention |
| application logs | short raw retention; aggregate longer |

Exact periods are commercial/legal policy, not an engineering constant.

## 2. Lifecycle

~~~mermaid
flowchart LR
    CREATED[Created] --> ACTIVE[Active Retention]
    ACTIVE --> EXPIRING[Retention Approaching]
    EXPIRING --> ARCHIVE[Reduced Access / Archive]
    ARCHIVE --> PURGE[Physical Deletion]
    PURGE --> DERIVED[Derived Store Cleanup]
    BACKUP[Backups] -. expiration policy .-> PURGE
~~~

## 3. Retention Metadata

Sensitive long-lived records may require:

- retention_class;
- retention_until;
- legal_hold where applicable;
- deleted_at;
- deletion_job state.

## 4. Tenant Configuration

Tenants may configure retention only within platform-supported bounds.

Example:

~~~text
conversation_retention_days
ai_trace_retention_days
raw_webhook_retention_days
~~~

A tenant setting cannot violate platform security/legal requirements.

## 5. Deletion Semantics

Logical deletion may hide data immediately while physical cleanup happens asynchronously.

Sequence:

~~~text
user/admin delete
 -> canonical record disabled/deleted
 -> API access blocked
 -> derived indexes queued for deletion
 -> object storage cleanup
 -> analytics projection cleanup
 -> backup expiry according to backup policy
~~~

## 6. AI Trace Retention

AI traces can contain:

- customer messages;
- retrieved documents;
- tool outputs;
- model output.

Therefore raw trace retention should be shorter or more restricted than operational conversation state unless a contract requires otherwise.

## 7. Knowledge Deletion

When a knowledge source is deleted, retrieval must stop using it before index deletion completes.

The canonical deletion flag is authoritative.

## 8. Audit Retention

Audit records should preserve:

- actor;
- organization;
- operation;
- resource;
- timestamp;
- result;
- correlation.

Do not store unnecessary sensitive payloads merely to create an audit trail.

## 9. Legal / Compliance Hold

Where the business later requires a legal hold mechanism:

~~~mermaid
stateDiagram-v2
    [*] --> RETAINING
    RETAINING --> EXPIRING
    EXPIRING --> ON_HOLD
    ON_HOLD --> RETAINING
    EXPIRING --> PURGED
    RETAINING --> PURGED
~~~

A hold prevents deletion while it is active.

## 10. Backups

Deletion from the primary database does not imply immediate removal from backups.

Backup expiration follows the backup retention policy.

Restored backups must still enforce current access controls after recovery.

## 11. Privacy-Safe Exports

Exports should not extend retention accidentally.

Generate only requested/scope-authorized data and use expiring access.

## 12. Observability

Track:

- pending deletion count;
- deletion lag;
- failed purge jobs;
- index cleanup lag;
- retention-policy distribution;
- legal holds.

## 13. Failure Modes

| Failure | Behavior |
|---|---|
| purge worker fails | retry |
| derived index cleanup fails | canonical data remains deleted/blocked |
| storage cleanup fails | alert + retry |
| retention config invalid | reject configuration |
| legal hold active | block purge |

## 14. Acceptance Criteria

- Retention is defined per data class.
- Logical deletion blocks access quickly.
- Derived stores eventually clean up.
- Backups follow separate expiry policy.
- Holds can prevent deletion where implemented.
- Retention operations are observable and auditable.
