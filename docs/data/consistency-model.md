# Consistency Model

> Status: **Target data consistency contract**

Not all system state needs strong consistency. The architecture explicitly chooses consistency per data class.

## 1. Consistency Classes

| Data | Model | Reason |
|---|---|---|
| tenant authorization | strong | security |
| membership | strong | security |
| active conversation control | strong | race prevention |
| assignment ownership | strong | operational correctness |
| payment/subscription | strong + reconciliation | financial integrity |
| usage reservations | strong | quota enforcement |
| outbox | transactional | event reliability |
| search index | eventual | derived |
| vector index | eventual | derived |
| analytics | eventual | scalability |
| UI realtime projection | eventual | communication |

## 2. Decision Flow

~~~mermaid
flowchart LR
REQUEST[Operation] --> CLASSIFY[Classify Data]
CLASSIFY --> STRONG{Strong Needed?}
STRONG -->|yes| TX[Transactional Boundary]
STRONG -->|no| EVENT[Eventual Projection]
TX --> COMMIT[Commit]
COMMIT --> EVENT
EVENT --> PROJECTION[Derived State]
~~~

## 3. Strong Consistency Rules

Use strong consistency when stale state could cause:

- unauthorized access;
- duplicate financial effect;
- conflicting assignment;
- incorrect conversation control;
- quota over-consumption.

## 4. Eventual Consistency Rules

Eventual state is acceptable for:

- analytics;
- search;
- dashboards;
- vector indexes;
- non-critical counters.

The UI should expose freshness where stale data could surprise operators.

## 5. Read-After-Write

Critical commands return authoritative transactional state immediately.

Example:

~~~text
POST assignment
 -> transaction commits
 -> response contains current assignment
~~~

Derived dashboards update asynchronously.

## 6. Conflict Handling

When state versions conflict:

~~~text
read version N
write with expected N
server has N+1
=> CONFLICT
~~~

Client must re-read and decide how to merge.

## 7. Reconciliation

External systems remain independently consistent.

Use reconciliation for:

- payment;
- provider delivery;
- external CRM;
- n8n callbacks;
- unknown tool outcomes.

## 8. Acceptance

Every new data flow must declare its consistency class, authoritative source and reconciliation strategy.
