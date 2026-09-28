# Data Model and ERD

> Status: **Target production data contract**

PostgreSQL is the transactional source of truth for OMILINKS. Search/vector indexes, caches, analytics projections and object storage are derived/specialized stores.

## 1. Design Principles

The data model must provide:

- explicit tenant ownership;
- strong relational integrity;
- auditable state changes;
- safe concurrent updates;
- append-oriented history for messages/events/usage;
- explicit versioning where business meaning changes;
- minimal duplication of sensitive data.

## 2. Core Aggregate Map

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBERSHIP : contains
    ORGANIZATION ||--o{ CLIENT_ACCOUNT : serves
    ORGANIZATION ||--o{ PROGRAM : owns
    CLIENT_ACCOUNT ||--o{ PROGRAM : contracts
    PROGRAM ||--o{ SECTOR : contains
    SECTOR ||--o{ TEAM : contains

    ORGANIZATION ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ CUSTOMER_IDENTITY : has
    CUSTOMER ||--o{ CONVERSATION : participates
    CONVERSATION ||--o{ MESSAGE : contains
    CONVERSATION ||--o{ ASSIGNMENT : has
    WORKFORCE_MEMBER ||--o{ ASSIGNMENT : receives
    ORGANIZATION ||--o{ WORKFORCE_MEMBER : owns

    ORGANIZATION ||--o{ KNOWLEDGE_BASE : owns
    KNOWLEDGE_BASE ||--o{ DOCUMENT : contains
    DOCUMENT ||--o{ DOCUMENT_VERSION : versions
    DOCUMENT_VERSION ||--o{ CHUNK : contains

    ORGANIZATION ||--o{ AI_AGENT : owns
    AI_AGENT ||--o{ AI_RUN : produces
    AI_RUN ||--o{ TOOL_INVOCATION : creates

    ORGANIZATION ||--o{ WORKFLOW_DEFINITION : owns
    WORKFLOW_DEFINITION ||--o{ WORKFLOW_VERSION : versions
    WORKFLOW_VERSION ||--o{ WORKFLOW_RUN : executes

    ORGANIZATION ||--o{ QUALITY_EVALUATION : owns
    ORGANIZATION ||--o{ SUBSCRIPTION : owns
    SUBSCRIPTION ||--o{ PAYMENT : includes
    ORGANIZATION ||--o{ USAGE_RECORD : produces
~~~

## 3. Ownership Strategy

Every tenant-owned aggregate carries an explicit organization ownership path.

Recommended:

~~~text
customer.organization_id
conversation.organization_id
ai_run.organization_id
workflow_run.organization_id
quality_evaluation.organization_id
subscription.organization_id
usage_record.organization_id
~~~

Parent-child ownership must be consistent.

Example:

~~~text
conversation.organization_id
==
conversation.customer.organization_id
~~~

where the customer is the conversation's canonical customer.

## 4. UUIDs and External IDs

Internal primary keys should not depend on provider identifiers.

Use internal IDs for:

- customer;
- conversation;
- message;
- workflow;
- AI run;
- tool invocation.

Store external IDs separately:

~~~text
provider
provider_account_id
external_id
~~~

Add unique constraints appropriate to provider scope.

## 5. Aggregate Boundaries

Do not make every table an independent domain object.

Example aggregate:

~~~text
Conversation
  -> participants
  -> messages
  -> active control
  -> assignment state
~~~

Operations on that aggregate should preserve invariants atomically where necessary.

## 6. Append-Oriented History

Prefer append history for:

- messages;
- payment/provider events;
- usage records;
- assignment history;
- AI run steps;
- audit events;
- workflow step runs.

Mutable projections can be derived from history where useful.

## 7. State vs History

A current state field is useful for fast reads:

~~~text
conversation.control = human
~~~

History preserves why it is true:

~~~text
control_changed events
~~~

Do not force every UI query to replay the full history, but do not destroy history merely to keep a small table.

## 8. Unique Constraints

Important uniqueness classes include:

~~~text
organization + provider + provider_account + external_identity
organization + provider + provider_event_id
organization + idempotency_namespace + idempotency_key
workflow_run + step_id + execution_key
subscription + external_transaction_id
~~~

Exact constraint composition depends on business semantics.

## 9. Foreign Keys

Use foreign keys for ownership relationships.

Avoid silently allowing orphaned:

- assignments;
- messages;
- AI runs;
- payment records;
- workflow runs.

Cross-domain references still require application-level validation because the database cannot express every business rule.

## 10. Soft Delete

Soft deletion is not universal.

Use explicit lifecycle state when:

- historical references matter;
- retention requires hiding but not immediate physical deletion;
- the object has a meaningful lifecycle.

Use physical deletion where:

- data has reached retention boundary;
- no audit/history requirement remains;
- derived stores can be safely cleaned.

## 11. Timestamps

Use UTC timestamps with explicit semantics:

- created_at;
- updated_at;
- occurred_at;
- processed_at;
- completed_at;
- expires_at where appropriate.

Do not mix business occurrence time and ingestion time.

## 12. Concurrency

Mutable high-contention entities may require:

- version number;
- updated_at + optimistic concurrency;
- database row locking;
- unique constraints;
- atomic counters.

Usage/quotas may require stronger reservation semantics than ordinary CRUD.

## 13. Sensitive Data

Database columns should be classified:

- public operational;
- tenant confidential;
- sensitive PII;
- secret/credential;
- financial;
- security/audit.

Secrets should not normally be stored as plaintext.

## 14. Transaction Boundaries

Use one transaction for state that must commit together.

Example:

~~~text
conversation message create
+
outbox event
~~~

must commit atomically.

Do not keep database transactions open during model/provider network calls.

## 15. Derived Data

Derived examples:

- search indexes;
- vector embeddings;
- analytics aggregates;
- materialized dashboard views;
- caches.

Derived data may be rebuilt.

The application should be able to identify the canonical record that produced it.

## 16. Analytics Separation

Operational queries and analytical queries may diverge in scale.

Start with PostgreSQL read patterns that are safe.

As load grows, use read replicas/warehouse/event-driven projections without changing the authoritative domain model.

## 17. Schema Design Review Checklist

Before adding a table:

1. Which aggregate owns it?
2. What is the organization boundary?
3. What is the lifecycle?
4. What is mutable vs historical?
5. What must be unique?
6. What is the concurrency model?
7. What is the retention class?
8. What is the deletion behavior?
9. Does it generate/consume events?
10. Does it expose sensitive information?

## 18. Acceptance Criteria

- Tenant-owned data has explicit ownership.
- Provider IDs are not internal primary keys.
- Critical historical facts are preserved.
- Foreign keys and uniqueness constraints cover core integrity.
- Transaction boundaries are explicit.
- Sensitive data has classification/retention expectations.
- Derived stores can be rebuilt from canonical data.
