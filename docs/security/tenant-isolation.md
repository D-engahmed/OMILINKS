# Tenant Isolation — Implementation Specification

> Status: **Target isolation-control blueprint**

## 1. Fundamental Rule

Every tenant-owned resource access starts with known organization context.

~~~text
organization_id + resource_id
~~~

A resource ID alone is not sufficient.

## 2. Application Enforcement

Tenant-owned repository methods require organization context:

~~~text
getCustomer(organizationId, customerId)
getConversation(organizationId, conversationId)
listUsage(organizationId, filter)
~~~

This makes accidental global access harder to implement.

## 3. Database Defense in Depth

PostgreSQL RLS may provide a second enforcement layer.

Application authorization is still required for:

- role;
- scope;
- resource state;
- business policies.

## 4. Isolation Pipeline

~~~mermaid
flowchart TB
REQ[Request / Job / Event] --> CONTEXT[Organization Context]
CONTEXT --> REPO[Scoped Repository]
REPO --> AUTHZ[Authorization]
AUTHZ --> DOMAIN[Domain Invariants]
DOMAIN --> DB[(PostgreSQL)]
RLS[RLS] -. defense in depth .-> DB
~~~

## 5. Resource-ID Attack

~~~text
Tenant A owns conversation 111
Tenant B obtains identifier 111
Tenant B requests GET /conversations/111
=> no Tenant A data
=> no Tenant A mutation
~~~

## 6. Background Jobs

Every tenant-owned job carries:

~~~text
job_id
organization_id
resource_id
~~~

Worker verifies that the resource belongs to the job organization before mutation.

## 7. Search Isolation

Tenant scope is applied before:

- relational search;
- full-text search;
- vector search;
- analytics;
- export.

## 8. Cache Isolation

Unsafe:

~~~text
customer:123
~~~

Safer:

~~~text
org:456:customer:123
~~~

Sensitive cached decisions may also include scope/policy versions.

## 9. Object Storage

Use tenant-aware namespaces:

~~~text
organizations/{organization_id}/...
~~~

The application still authorizes every download.

## 10. Export Isolation

Exports require:

- permission;
- effective scope;
- asynchronous generation;
- audit;
- expiring access.

## 11. Cross-Tenant Event Processing

~~~mermaid
sequenceDiagram
participant BUS as Event Bus
participant W as Worker
participant DB as Database
BUS->>W: Tenant-scoped event
W->>DB: Load resource within tenant
DB-->>W: Match / mismatch
alt Match
  W->>DB: Apply change
else Mismatch
  W->>W: Quarantine security failure
end
~~~

## 12. Test Matrix

- get-by-ID;
- list;
- search;
- update;
- delete;
- export;
- vector retrieval;
- event replay;
- tool call;
- background job;
- billing lookup.

## 13. Detection

Monitor organization mismatches, repeated cross-tenant failures and unexpected RLS violations.

## 14. Acceptance

Tenant isolation is proven only when application tests and, where used, database-level controls both prevent cross-tenant access.
