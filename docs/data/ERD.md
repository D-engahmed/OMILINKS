# Data Model and ERD — Implementation Specification

> Status: **Target production data blueprint**

## 1. Database Role

PostgreSQL is the transactional source of truth for:

- tenancy;
- identity/membership;
- customers;
- conversations/messages;
- workforce/assignments;
- AI run metadata;
- workflows;
- quality;
- billing;
- usage;
- audit;
- outbox.

Search, vector, cache and analytics stores are derived.

## 2. Aggregate Map

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBERSHIP : contains
    ORGANIZATION ||--o{ CLIENT_ACCOUNT : owns
    ORGANIZATION ||--o{ PROGRAM : owns
    PROGRAM ||--o{ SECTOR : contains
    SECTOR ||--o{ TEAM : contains
    ORGANIZATION ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ CUSTOMER_IDENTITY : has
    CUSTOMER ||--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ ASSIGNMENT : has
    WORKFORCE_MEMBER ||--o{ ASSIGNMENT : receives
    ORGANIZATION ||--o{ WORKFORCE_MEMBER : owns
    ORGANIZATION ||--o{ AI_RUN : owns
    AI_RUN ||--o{ AI_RUN_STEP : contains
    AI_RUN ||--o{ TOOL_INVOCATION : creates
    ORGANIZATION ||--o{ WORKFLOW_RUN : owns
    ORGANIZATION ||--o{ QUALITY_EVALUATION : owns
    ORGANIZATION ||--o{ SUBSCRIPTION : owns
    ORGANIZATION ||--o{ USAGE_RECORD : produces
    ORGANIZATION ||--o{ OUTBOX_EVENT : publishes
~~~

## 3. Tenant Column Rule

Every tenant-owned table should normally have:

~~~text
organization_id NOT NULL
~~~

Exceptions require documented justification.

The organization ID is the first SQL predicate for tenant-owned reads.

## 4. Primary Keys

Use internal identifiers for domain resources.

Provider identifiers are separate columns with provider-scoped uniqueness.

Example:

~~~text
customer.id = internal UUID
customer_identity.external_id = provider ID
~~~

Never make a provider identifier the primary key of a core domain record.

## 5. Referential Integrity

Use foreign keys for:

- membership -> user/organization;
- conversation -> customer/organization;
- message -> conversation;
- assignment -> conversation/workforce;
- usage -> organization;
- payment -> subscription/payment intent.

Cross-domain invariants beyond FK capability are enforced at the application/domain layer.

## 6. Composite Uniqueness

Critical constraints:

~~~text
organization + provider + provider_account + external_identity
organization + provider + provider_event_id
organization + idempotency_namespace + idempotency_key
consumer + event_id
workflow_run + step_id + execution_key
~~~

These constraints protect against concurrency races.

## 7. Index Strategy

Common high-value indexes:

~~~text
conversation(organization_id, status, updated_at DESC)
conversation(organization_id, customer_id, updated_at DESC)
message(conversation_id, occurred_at ASC)
assignment(organization_id, status, assigned_at)
usage_record(organization_id, occurred_at DESC)
outbox_event(status, occurred_at)
~~~

Index design must follow actual production query plans, not assumptions.

## 8. Partial Indexes

Use partial indexes for hot states where appropriate.

Example concept:

~~~text
active assignments only
active workflow runs
pending outbox events
~~~

This reduces index size for operational queries.

## 9. Unique Constraints vs Application Checks

Application check:

~~~text
does identity exist?
 -> no
 -> insert
~~~

is insufficient under concurrency.

Database uniqueness is the final arbiter.

## 10. Optimistic Concurrency

Mutable aggregate records may contain:

~~~text
version INTEGER NOT NULL
~~~

Update:

~~~text
UPDATE ...
SET version = version + 1
WHERE id = ?
  AND version = expected_version
~~~

Zero affected rows means stale state.

## 11. Transaction Boundaries

Use one transaction for changes that must commit together.

Example:

~~~text
message insert
+
outbox event
+
idempotency record
~~~

Do not hold transaction open during provider/model calls.

## 12. JSON Columns

JSON is appropriate for:

- provider-specific metadata;
- flexible workflow variables;
- bounded integration configuration.

JSON is not appropriate for core fields that require:

- foreign keys;
- authorization;
- frequent filtering;
- uniqueness;
- reliable reporting.

## 13. PII Classification

Each sensitive field should have a classification:

~~~text
PUBLIC
INTERNAL
CONFIDENTIAL
PII
SENSITIVE_PII
FINANCIAL
SECRET
SECURITY_AUDIT
~~~

Classification drives retention, logging and access policy.

## 14. Soft Delete

Use lifecycle states when historical references matter.

Physical deletion is a retention process, not a normal UI CRUD operation.

## 15. Partitioning

Do not partition prematurely.

Candidates at scale may include:

- messages by time/tenant strategy;
- usage records by billing period;
- audit events by time.

Partitioning requires query/index/backup testing first.

## 16. Read Models

Operational dashboards can use read models/materialized projections when query cost demands it.

Read models must identify their source/event position so they can be rebuilt.

## 17. Consistency Classes

~~~text
strong:
  authorization
  tenant ownership
  current conversation state
  billing state

eventual:
  search
  vector index
  analytics
  dashboard projections
~~~

The UI must communicate when data is eventually consistent.

## 18. Migration Safety

Schema changes follow expand/migrate/contract.

See migration policy for the deployment sequence.

## 19. Validation Queries

Production data checks should periodically verify:

- child organization matches parent;
- orphaned foreign keys do not exist;
- active assignment count is valid;
- subscription references valid plan;
- usage source IDs are unique where required;
- outbox backlog is bounded.

## 20. Acceptance

The data model is implementation-ready when ownership, keys, constraints, indexes, transactions, concurrency and data classification are explicit.
