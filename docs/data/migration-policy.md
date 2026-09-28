# Migration Policy — Implementation Specification

> Status: **Target production database-change blueprint**

Database migration is a compatibility problem across code versions, data and operations.

## 1. Expand / Migrate / Contract

~~~mermaid
flowchart LR
OLD[Current Schema] --> EXPAND[Add Compatible Schema]
EXPAND --> DEPLOY[Deploy Compatible Code]
DEPLOY --> BACKFILL[Bounded Backfill]
BACKFILL --> SWITCH[Switch Reads/Writes]
SWITCH --> CONTRACT[Remove Legacy]
~~~

## 2. Expand Rules

Safe candidates:

- new nullable column;
- new table;
- new compatible index;
- new non-required field.

Avoid removing/renaming fields used by currently deployed code.

## 3. Dual Read / Dual Write

For semantic changes:

~~~text
old field
new field
      |
      +-> dual write during migration
      |
      +-> backfill
      |
      +-> compare
      |
      +-> cutover
~~~

Remove the old field only after compatibility evidence exists.

## 4. Backfill Design

Large backfills should have:

~~~text
batch size
checkpoint
progress
rate limit
retry
pause/resume
error count
~~~

Do not hold one transaction over millions of rows.

## 5. Lock Analysis

Before production migration assess:

- affected rows;
- indexes;
- lock duration;
- replica impact;
- expected write amplification;
- table rewrite risk.

## 6. Constraint Rollout

For large tables, introduce constraints using rollout methods that avoid long blocking operations where supported.

Then validate existing data before enforcement becomes mandatory.

## 7. Destructive Changes

Before dropping data:

- all readers migrated;
- all writers migrated;
- backups verified;
- restoration proven;
- rollback/forward-fix documented;
- monitoring active.

## 8. Application Ordering

~~~text
1. backward-compatible code
2. additive migration
3. backfill
4. switch reads
5. remove old writes
6. later contract
~~~

Never deploy code that requires a column before that column exists.

## 9. Migration Testing

CI should test:

- clean database;
- previous supported version -> current;
- full migration chain;
- representative data;
- constraints;
- application startup;
- queries after migration.

## 10. Recovery

If migration partially succeeds:

~~~text
inspect state
 -> repair/forward-fix
 -> do not assume rollback
~~~

A database rollback is not always safe once external side effects or irreversible transformations occurred.

## 11. Acceptance

Every production migration must have compatibility analysis, lock analysis, data validation, deployment ordering and recovery procedure.
