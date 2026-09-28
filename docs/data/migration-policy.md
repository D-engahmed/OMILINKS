# Migration Policy

> Status: **Target production database-change contract**

Database migrations are controlled changes to business state. Migration safety includes schema compatibility, lock behavior, backfill strategy, deployment ordering and recovery.

## 1. Preferred Strategy

Use expand -> migrate -> contract.

~~~mermaid
flowchart LR
OLD[Old Schema] --> EXPAND[Additive Schema]
EXPAND --> COMPAT[Backward-Compatible Code]
COMPAT --> BACKFILL[Bounded Backfill]
BACKFILL --> SWITCH[Switch Reads / Writes]
SWITCH --> CONTRACT[Remove Legacy Later]
~~~

## 2. Expand Phase

Allowed examples:

- add nullable column;
- add new table;
- add compatible index;
- add new enum value when consumers tolerate it.

Do not remove data required by currently deployed code.

## 3. Compatibility Window

During rolling deployment, old and new application versions may run simultaneously.

Therefore schema changes must remain compatible across that overlap.

## 4. Backfills

Large backfills should:

- run in batches;
- avoid unbounded locks;
- expose progress;
- be resumable;
- be rate limited;
- be observable.

Do not make a huge backfill part of an HTTP request.

## 5. Indexes and Locks

Before production:

- estimate row count;
- estimate index creation time;
- inspect hot queries;
- determine lock behavior;
- understand replica impact;
- plan rollback/mitigation.

Use deployment-safe index methods supported by the selected PostgreSQL version where appropriate.

## 6. Data Transformation

For irreversible transformations:

~~~text
old_value
 -> transformed_value
 -> validation
 -> cutover
~~~

Retain enough information to detect and repair partial migration.

## 7. Destructive Migration

Destructive actions require evidence:

- no supported application version reads the old field;
- backups are current;
- restore procedure is known;
- monitoring exists;
- rollback/forward-fix strategy is defined.

## 8. Application + Migration Ordering

Safe example:

~~~text
1. deploy code that understands old + new schema
2. apply migration
3. backfill
4. switch reads
5. stop old writes
6. later remove legacy
~~~

Unsafe example:

~~~text
drop old column
then deploy code
that still reads old column
~~~

## 9. Transaction Boundaries

Small metadata migrations may be transactional.

Large/long operations may need phased execution.

Do not assume rollback is possible after external systems or irreversible data transformations are involved.

## 10. Migration Testing

CI should test:

- fresh database;
- migration from supported previous version;
- migration chain;
- application boot after migration;
- representative queries;
- rollback/forward-fix procedure where applicable.

## 11. Production Checklist

Before migration:

- backup verified;
- lock impact assessed;
- row count estimated;
- feature compatibility checked;
- monitoring ready;
- rollback/mitigation plan documented.

After migration:

- schema version verified;
- error rate checked;
- latency checked;
- data invariants sampled;
- workers checked;
- event processing checked.

## 12. Acceptance Criteria

- Migrations are compatibility-first.
- Large backfills are resumable.
- Destructive changes are delayed until safe.
- Production lock impact is assessed.
- Supported migration path is tested in CI.
- Recovery strategy exists for irreversible changes.
