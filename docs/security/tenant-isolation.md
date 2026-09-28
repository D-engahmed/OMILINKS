# Tenant Isolation

> Status: **Target production security contract**

Tenant isolation is a correctness property of the entire platform. A globally unique UUID does not grant access.

## 1. Hard Rule

Every tenant-owned operation must establish organization context before accessing the resource.

Preferred:

~~~text
repository.getConversation(
  organizationId,
  conversationId
)
~~~

Unsafe default:

~~~text
repository.getConversation(conversationId)
then authorize later
~~~

The second pattern creates an authorization gap if any caller forgets the later check.

## 2. Isolation Layers

~~~mermaid
flowchart TB
REQ[Request / Event / Job] --> TENANT[Resolve Organization]
TENANT --> QUERY[Scoped Data Access]
QUERY --> AUTHZ[Authorization]
AUTHZ --> DOMAIN[Domain Invariants]
DOMAIN --> DB[(PostgreSQL)]
RLS[PostgreSQL RLS] -. defense in depth .-> DB
TEST[Negative Isolation Tests] -. verify .-> QUERY
~~~

Application authorization remains mandatory even if PostgreSQL RLS is used.

## 3. Ownership Model

Tenant-owned records should normally contain organization ownership explicitly.

Example:

~~~text
conversation.organization_id
customer.organization_id
workflow.organization_id
ai_run.organization_id
usage_record.organization_id
~~~

Where parent/child relationships exist, validate that parent and child organization IDs match.

## 4. Query Rules

Every collection query includes organization scope.

Examples:

~~~text
customers WHERE organization_id = current_org
conversations WHERE organization_id = current_org
usage WHERE organization_id = current_org
~~~

Search, exports, analytics and background processing follow the same rule.

## 5. Resource-ID Attack

Typical attack:

~~~text
Tenant A has conversation 111
Attacker in Tenant B obtains ID 111
Attacker calls GET /conversations/111
~~~

Expected result:

~~~text
No data from Tenant A is disclosed.
~~~

The same negative test applies to:

- customers;
- tools;
- AI runs;
- workflow runs;
- usage;
- invoices;
- integrations;
- exports.

## 6. Background Jobs

Events/jobs carry tenant context where applicable.

Workers must reject:

- missing organization;
- invalid organization;
- resource/org mismatch.

No default or ambient tenant is allowed for tenant-owned jobs.

## 7. Event Isolation

A consumer must not trust event payload resource IDs without verifying tenant ownership.

Example:

~~~mermaid
sequenceDiagram
participant BUS as Event Bus
participant W as Worker
participant DB as PostgreSQL
BUS->>W: tenant-scoped event
W->>DB: Load resource inside organization
DB-->>W: Match / mismatch
alt Match
  W->>DB: Apply operation
else Mismatch
  W-->>BUS: Quarantine / security failure
end
~~~

## 8. RLS Defense in Depth

PostgreSQL Row Level Security can provide a second enforcement layer.

RLS is not a reason to remove application-level authorization because:

- business permissions are richer than tenant ownership;
- service operations may require controlled bypass;
- not all resources map directly to one SQL table;
- authorization depends on roles/scopes and resource state.

## 9. Cross-Tenant Joins

Any join between tenant-owned tables must preserve organization consistency.

Avoid:

~~~text
Customer
JOIN Conversation
JOIN Team
without tenant predicates
~~~

Prefer repository/domain operations that make ownership explicit.

## 10. Cache Isolation

Tenant-scoped cache keys must include organization identity.

Unsafe:

~~~text
customer:123
~~~

Safer:

~~~text
org:456:customer:123
~~~

For sensitive caches, include effective scope and policy version where needed.

## 11. Search / Vector Isolation

Search indexes are not trusted isolation boundaries by themselves.

Queries must apply tenant/scope filtering before returning candidate content.

This applies to:

- customer search;
- conversation search;
- knowledge retrieval;
- analytics search;
- AI retrieval.

## 12. File / Object Storage Isolation

Object paths should include a tenant namespace or equivalent access boundary.

Example:

~~~text
organizations/{org_id}/documents/{document_id}/...
~~~

Download authorization still happens through the application; storage path structure alone is not sufficient.

## 13. Export Isolation

Exports are high-risk because a single query can expose large amounts of data.

Every export:

- resolves organization;
- checks permission;
- applies scope filters;
- records audit;
- generates asynchronously;
- creates an expiring access reference.

## 14. Tenant Isolation Testing

Required automated categories:

- cross-tenant get-by-ID;
- cross-tenant list/search;
- cross-tenant update;
- cross-tenant delete;
- cross-tenant export;
- cross-tenant event replay;
- cross-tenant tool call;
- cross-tenant AI retrieval;
- cross-tenant background job;
- cross-tenant billing lookup.

## 15. Incident Detection

Indicators include:

- repeated cross-tenant 403/404 patterns;
- unexpected organization ID mismatch;
- RLS violation;
- access to resources outside membership scope;
- abnormal export patterns.

## 16. Acceptance Criteria

- No tenant-owned repository method is unscoped.
- Cross-tenant IDs disclose no protected data.
- Background jobs require explicit tenant context.
- Search/vector retrieval is tenant-filtered.
- Cache/object storage access has tenant-aware authorization.
- Exports are fully scoped and audited.
- Negative isolation tests run in CI.

