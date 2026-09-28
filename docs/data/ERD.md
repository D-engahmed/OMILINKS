# Data Model and ERD

> Status: **Target / normative engineering design**.

PostgreSQL owns transactional truth. Search/vector, caches, analytics tables and object storage are derived or specialized.

## Contract

Core relationships: Organization owns Membership, Customer, Conversation, Workforce, Knowledge, Workflow, Quality and Billing. Customer has identities; Conversation has messages and assignments; AI has runs; Workflow has versioned runs; Subscription has usage. Use foreign keys and uniqueness constraints for ownership/idempotency.

## Mermaid Flow

```mermaid
erDiagram
ORGANIZATION ||--o{ MEMBERSHIP : has
ORGANIZATION ||--o{ CUSTOMER : owns
ORGANIZATION ||--o{ CONVERSATION : owns
CUSTOMER ||--o{ CONVERSATION : participates
CONVERSATION ||--o{ MESSAGE : contains
CONVERSATION ||--o{ ASSIGNMENT : assigned
ORGANIZATION ||--o{ AI_RUN : owns
ORGANIZATION ||--o{ WORKFLOW_RUN : owns
ORGANIZATION ||--o{ SUBSCRIPTION : has
```

## Engineering Rule

The design must fail closed on authorization, preserve tenant scope, make retries safe, and expose enough telemetry to diagnose production behavior.
