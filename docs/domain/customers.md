# Customer Domain — Implementation Specification

> Status: **Target implementation blueprint**

Customer is the canonical identity aggregate for people or business contacts interacting with an organization through channels.

## 1. Aggregate

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ CUSTOMER : owns
    CUSTOMER ||--o{ CUSTOMER_IDENTITY : has
    CUSTOMER ||--o{ CUSTOMER_ATTRIBUTE : has
    CUSTOMER ||--o{ CUSTOMER_TAG : tagged
    CUSTOMER ||--o{ CONSENT : grants
    CUSTOMER ||--o{ CONVERSATION : participates
~~~

## 2. Customer Record

Conceptual fields:

~~~text
customer_id
organization_id
display_name
status
version
created_at
updated_at
merged_into_id
deleted_at
~~~

Important searchable/business fields should be explicit rather than hidden in an uncontrolled JSON blob.

## 3. External Identity

Canonical uniqueness:

~~~text
organization_id
provider
provider_account_id
external_identity_id
~~~

Database constraint:

~~~text
UNIQUE(
  organization_id,
  provider,
  provider_account_id,
  external_identity_id
)
~~~

This protects against duplicate identities under concurrent ingestion.

## 4. Creation Algorithm

~~~mermaid
sequenceDiagram
participant C as Channel Adapter
participant S as Customer Service
participant DB as PostgreSQL
participant O as Outbox
C->>S: Resolve external identity
S->>DB: Lookup scoped identity
alt Exists
  DB-->>S: Existing customer
else Missing
  S->>DB: Create customer
  S->>DB: Create identity
  S->>O: customer.created
  DB-->>S: Commit
end
S-->>C: Canonical customer ID
~~~

The unique constraint is the final race protection.

## 5. Identity Matching Hierarchy

1. exact provider identity;
2. deterministic verified key;
3. tenant-configured strong rule;
4. ambiguous -> review.

LLM similarity may assist review but must not silently perform irreversible merge.

## 6. Merge Command

A merge uses one transaction:

~~~text
lock source + target
verify same organization
verify merge eligibility
move/associate allowed identities
preserve historical references
mark source as MERGED
record audit + event
COMMIT
~~~

Concurrent merge attempts should conflict.

## 7. Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> ACTIVE
    ACTIVE --> RESTRICTED
    RESTRICTED --> ACTIVE
    ACTIVE --> MERGED
    ACTIVE --> DELETION_PENDING
    DELETION_PENDING --> DELETED
~~~

A merged source remains traceable for historical records.

## 8. Consent

Consent may contain:

~~~text
purpose
channel
status
granted_at
withdrawn_at
source
policy_version
~~~

Consent is not the same concept as internal authorization.

## 9. Search

Search is tenant-scoped before result generation.

Unsafe:

~~~text
global search -> application filter
~~~

Required:

~~~text
authorized scope -> search -> projection
~~~

## 10. Export

Customer exports are:

- permissioned;
- tenant/scoped;
- asynchronous;
- audited;
- expiring.

## 11. Cross-Domain Contracts

Channels resolve provider identities.

Conversations reference canonical customer.

AI receives an explicit customer data projection.

Quality can aggregate customer dimensions without copying unnecessary PII.

Billing uses organization identity for subscription state.

## 12. Failure Modes

| Failure | Behavior |
|---|---|
| duplicate external identity | return existing customer |
| identity race | unique constraint |
| ambiguous match | review/no auto-merge |
| merge conflict | transaction conflict |
| cross-tenant lookup | deny |
| deletion with new inbound contact | explicit retention/recreation policy |
| invalid attribute | reject before mutation |

## 13. Observability

Track:

- new customer rate;
- identity match rate;
- ambiguity rate;
- merge rate;
- duplicate attempts;
- deletion backlog;
- export activity.

## 14. Security Tests

- external identity collision between tenants;
- cross-tenant customer ID;
- unauthorized sensitive attribute;
- cross-tenant merge;
- export scope escape;
- identity spoofing;
- concurrent merge.

## 15. Acceptance

Customer identity is complete when deterministic mapping, merge safety, privacy, retention and tenant isolation are testable properties.
