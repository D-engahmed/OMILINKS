# Backup and Restore — Implementation Specification

> Status: **Target production recovery blueprint**

## 1. Recovery Objectives

Production defines:

~~~text
RPO = maximum acceptable data loss
RTO = maximum acceptable recovery time
~~~

Targets differ by environment/service criticality.

## 2. Backup Layers

- PostgreSQL full/managed backups;
- WAL/point-in-time recovery where supported;
- object-storage versioning/lifecycle;
- event/outbox history;
- configuration/version artifacts.

Backups are encrypted and access-controlled.

## 3. Restore Architecture

~~~mermaid
flowchart TB
PRIMARY[(Production DB)] --> BACKUP[Encrypted Backup]
BACKUP --> RESTORE[Isolated Restore]
RESTORE --> VERIFY[Integrity + Schema Verification]
VERIFY --> APP[Application Smoke Tests]
APP --> ISOLATION[Tenant Isolation Tests]
ISOLATION --> RECON[Provider / Payment Reconciliation]
RECON --> READY[Recovery Ready]
~~~

## 4. Restore Procedure

1. declare recovery point;
2. isolate recovery target;
3. restore PostgreSQL;
4. verify schema/migrations;
5. restore object-storage dependencies;
6. start application in recovery mode;
7. validate tenant isolation;
8. recover queue/event processing;
9. reconcile external providers;
10. resume customer traffic.

## 5. Queue Recovery

Queue state may be lost or duplicated during catastrophic failure.

Recovery uses durable event/outbox records as a replay source.

Duplicate events are safe only because consumers are idempotent.

## 6. Provider Reconciliation

After recovery compare external state for:

- payment;
- message delivery;
- integration connection;
- provider jobs where relevant.

Do not assume external state rolled back with the database.

## 7. Restore Verification

Verify:

~~~text
authentication
organization resolution
customer reads
conversation reads
assignment state
workflow state
AI run metadata
billing state
event publication
outbox backlog
~~~

## 8. Security Recovery

If compromise is suspected:

~~~mermaid
flowchart LR
INCIDENT[Compromise] --> CONTAIN[Contain]
CONTAIN --> EVIDENCE[Preserve Evidence]
EVIDENCE --> RESTORE[Known-good Restore]
RESTORE --> ROTATE[Rotate Secrets]
ROTATE --> VERIFY[Security Verification]
VERIFY --> RECOVER[Resume]
~~~

## 9. Restore Drills

A restore drill measures:

- time to first recovered DB;
- application validation time;
- RPO achieved;
- RTO achieved;
- manual steps;
- missing dependency;
- reconciliation duration.

Keep historical drill evidence.

## 10. Failure Modes

| Failure | Response |
|---|---|
| backup missing | incident |
| restore corruption | alternate recovery point |
| object missing | restore/version retrieval |
| external state mismatch | reconciliation |
| compromised credential | rotate before service resume |
| queue duplicate | idempotent consumer |

## 11. Acceptance

Backup readiness means a successful restore drill has demonstrated actual recovery and tenant isolation, not merely that a backup job completed.
