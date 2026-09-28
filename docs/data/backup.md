# Backup and Restore

> Status: **Target production recovery contract**

Backups exist to recover data after corruption, operational error, infrastructure loss or security incident.

A successful backup job is not proof of recoverability. Restore tests are required.

## 1. Recovery Objectives

Production must define:

- RPO: acceptable data loss window;
- RTO: acceptable recovery time.

These values should differ by environment/tier.

## 2. Backup Layers

~~~text
PostgreSQL
 -> automated managed backup
 -> point-in-time recovery / WAL where supported
Object Storage
 -> versioning
 -> replication where required
Event/Outbox
 -> retained history useful for replay
~~~

Event history complements backups but does not replace them.

## 3. Recovery Architecture

~~~mermaid
flowchart TB
    PG[(Primary PostgreSQL)] --> FULL[Backup]
    FULL --> STORE[Encrypted Backup Storage]
    STORE --> RESTORE[Isolated Restore Target]
    RESTORE --> VERIFY[Integrity Verification]
    VERIFY --> SMOKE[Application Smoke Tests]
    SMOKE --> RECON[External State Reconciliation]
    RECON --> READY[Recovery Complete]
~~~

## 4. Restore Procedure

1. declare recovery point;
2. isolate restore target;
3. restore database;
4. verify schema/constraints;
5. restore required object-storage references;
6. validate tenant isolation;
7. run application smoke tests;
8. replay/recover safe durable events where required;
9. reconcile provider/payment state;
10. restore service and monitor.

## 5. Backup Integrity

Check:

- backup completion;
- size anomalies;
- age;
- encryption;
- retention;
- access permissions;
- restore test results.

Do not treat "backup file exists" as an integrity test.

## 6. Restore Drill

A scheduled drill should measure:

~~~text
backup age
restore duration
verification duration
manual intervention
missing dependencies
RPO achieved
RTO achieved
~~~

Store drill results.

## 7. External Provider State

After database restore, external systems may have advanced.

Examples:

- provider sent messages;
- payment completed;
- webhook registration changed;
- integration credential rotated.

Therefore reconciliation is required before declaring state fully recovered.

## 8. Security Incident Restore

If restoring after compromise:

~~~mermaid
flowchart LR
INCIDENT[Compromise] --> CONTAIN[Contain]
CONTAIN --> SNAPSHOT[Preserve Evidence]
SNAPSHOT --> CLEAN[Known-good Restore]
CLEAN --> ROTATE[Rotate Credentials]
ROTATE --> VERIFY[Security Verification]
VERIFY --> RECOVER[Resume]
~~~

Do not restore compromised credentials or unsafe configuration blindly.

## 9. Object Storage

Objects should have:

- tenant-aware namespace;
- lifecycle/retention;
- integrity checksum;
- versioning where appropriate;
- access control.

Database references must be checked after restore.

## 10. Testing

Restore tests must verify:

- authentication works;
- organization boundaries work;
- customer retrieval works;
- conversation retrieval works;
- workflow state is coherent;
- billing state is coherent;
- event/outbox processing works;
- critical integrations can reconnect.

## 11. Acceptance Criteria

- RPO/RTO are defined for production.
- Restore has been demonstrated, not assumed.
- Tenant isolation is tested after restore.
- External provider/payment state is reconciled.
- Credentials are rotated when recovery involves compromise.
- Restore drill results are retained.
