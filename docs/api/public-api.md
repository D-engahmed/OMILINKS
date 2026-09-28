# Public API

> Status: **Target production API contract**

The public API exposes stable business capabilities to customer systems and approved integrations. It is not a direct database API and it is not a mirror of internal frontend requests.

## 1. Design Principles

The public API must be:

- versioned;
- tenant-aware;
- permissioned;
- retry-safe where duplicate requests can create duplicate business effects;
- cursor-paginated;
- explicit about failures;
- observable;
- backward-compatible inside a major version.

## 2. Public Resource Boundary

Potential resources include:

~~~text
organizations
client-accounts
programs
sectors
teams
customers
customer-identities
conversations
messages
assignments
workforce-members
knowledge-bases
workflows
workflow-runs
ai-agents
ai-runs
quality-evaluations
subscriptions
usage
integrations
~~~

Not every persistence table becomes public.

A resource becomes public only when:

- its semantics are stable;
- authorization is well-defined;
- lifecycle is understood;
- backward compatibility can be maintained.

## 3. API Versioning

The external namespace is:

~~~text
/api/v1/...
~~~

Within a major version, prefer additive changes.

Breaking changes include:

- changing field meaning;
- removing required response fields;
- changing authentication semantics;
- changing error meaning;
- changing state transition guarantees;
- altering idempotency semantics.

Breaking changes require a new major version or explicit compatibility strategy.

## 4. Idempotency

Retry-sensitive mutations accept:

~~~text
Idempotency-Key: <client-generated value>
~~~

The server stores:

- authenticated client identity;
- organization;
- operation/route semantics;
- request fingerprint;
- response;
- status;
- expiration.

Same key plus same meaningful request returns the original result.

Same key plus a different meaningful request returns a deterministic conflict.

## 5. Pagination

Large collections use opaque cursors.

Example:

~~~text
GET /api/v1/conversations?limit=50&cursor=<opaque>
~~~

Ordering should be stable:

~~~text
created_at DESC
+ id DESC
~~~

The cursor must represent a position within the authorized tenant/scope, not expose database internals.

## 6. Filtering

Filters are allowlisted and documented.

Example:

~~~text
GET /api/v1/conversations
  ?status=open
  &channel=whatsapp
  &assignedTo=<id>
~~~

Never accept arbitrary SQL-like filter expressions from clients.

## 7. Error Contract

Use one machine-readable envelope:

~~~json
{
  "error": {
    "code": "CONFLICT",
    "message": "The conversation changed before this operation completed.",
    "requestId": "req_123",
    "details": {}
  }
}
~~~

Error codes are stable API contracts.

Messages may evolve as long as their meaning and security implications remain compatible.

## 8. HTTP Semantics

| Situation | Typical response |
|---|---|
| success read | 200 |
| resource created | 201 |
| async accepted | 202 |
| successful no-content delete | 204 |
| validation error | 400 |
| unauthenticated | 401 |
| forbidden | 403 |
| not found/undiscoverable | 404 |
| state/version/idempotency conflict | 409 |
| rate limited | 429 |
| upstream unavailable | 502/503 |
| unexpected internal error | 500 |

## 9. Optimistic Concurrency

Mutable resources should expose version/ETag where concurrent edits can cause data loss.

Example:

~~~text
If-Match: "conversation-v42"
~~~

If the server is on version 43, return 409.

This is especially important for:

- conversation control;
- assignments;
- customer profile;
- AI configuration;
- workflow editing;
- billing administration.

## 10. Asynchronous Operations

Long operations return an operation reference:

~~~json
{
  "operationId": "op_123",
  "status": "queued"
}
~~~

Examples:

- bulk exports;
- knowledge ingestion;
- AI batch evaluation;
- large reconciliation;
- workflow execution that requires asynchronous processing.

## 11. API Architecture

~~~mermaid
flowchart LR
CLIENT[Customer System] --> EDGE[API Edge]
EDGE --> AUTH[Authentication]
AUTH --> TENANT[Tenant Resolution]
TENANT --> Z[Authorization]
Z --> APP[Application Service]
APP --> DOMAIN[Domain]
DOMAIN --> DB[(PostgreSQL)]
DOMAIN --> OUTBOX[Outbox]
OUTBOX --> EVENTS[Events / Webhooks]
~~~

Public endpoints use the same domain/application behavior as the first-party application whenever practical.

## 12. Customer Webhooks

Outbound webhooks are separate from public request/response APIs.

They require:

- signed payload;
- event ID;
- version;
- timestamp;
- retry state;
- delivery attempt;
- response status;
- dead-letter state.

Delivery attempts are observable and support safe replay.

## 13. Rate Limiting

Separate classes should protect:

- authentication;
- standard reads;
- writes;
- search;
- export;
- AI operations;
- bulk operations;
- webhook administration.

Return retry information where appropriate.

## 14. Tenant Isolation

All public resources resolve inside the caller's authorized organization and scope.

This must be enforced before:

- object retrieval;
- collection search;
- pagination;
- export;
- aggregation;
- webhook generation.

A client-supplied organization identifier cannot broaden access.

## 15. API Key Model

Public API credentials should include:

- key identity;
- client name;
- organization scope;
- permissions;
- created/last-used timestamps;
- expiry where applicable;
- revocation state;
- rate-limit class.

The raw key is shown only during issuance where practical.

## 16. Bulk Operations

Bulk endpoints must define:

- maximum request size;
- maximum object count;
- partial success semantics;
- per-item errors;
- idempotency;
- asynchronous processing;
- cancellation behavior.

Do not return one giant synchronous request that can hold an API worker indefinitely.

## 17. Export Security

Exports are sensitive operations.

Require:

- explicit permission;
- tenant/scoped query;
- audit record;
- bounded export size;
- asynchronous generation;
- expiring download reference.

The download URL must not become a permanent authorization bypass.

## 18. API Evolution

Before a breaking contract change:

1. define replacement;
2. publish compatibility/deprecation path;
3. migrate internal consumers;
4. monitor old-version traffic;
5. remove only under documented lifecycle policy.

## 19. Acceptance Criteria

- Public writes are idempotent where documented.
- Reusing an idempotency key with different input returns conflict.
- Pagination is stable and tenant-safe.
- Error codes are consistent.
- Optimistic concurrency protects mutable resources.
- Long-running operations are asynchronous.
- Export operations are audited and scoped.
- Public endpoints do not create a second business-rule implementation.
