# Public API — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Public API Boundary

The public API exposes stable business capabilities. It must not expose database tables as-is.

Each endpoint maps to an application use case:

~~~text
HTTP route
 -> request schema
 -> auth/tenant context
 -> authorization
 -> application command/query
 -> domain
 -> response DTO
~~~

## 2. Versioning

Base path:

~~~text
/api/v1
~~~

Breaking semantic changes require:

- a new major version;
- compatibility layer; or
- formally documented migration.

## 3. Mutation Safety

A mutation should define:

~~~text
authorization
validation
idempotency
concurrency
transaction
events
failure response
~~~

before implementation.

## 4. Idempotency Contract

Header:

~~~text
Idempotency-Key: <opaque client key>
~~~

Store:

~~~text
organization/client identity
route
key
request hash
status
response
created_at
expires_at
~~~

Decision:

~~~text
same key + same request -> return original outcome
same key + different request -> 409
~~~

## 5. Pagination Contract

Collections use opaque cursors.

Recommended ordering:

~~~text
created_at DESC
+ id DESC
~~~

A cursor is scoped to the authorized tenant/query shape.

Do not allow clients to edit cursor internals.

## 6. Concurrency Contract

For resources with lost-update risk:

~~~text
ETag: "v42"
If-Match: "v42"
~~~

If server is v43:

~~~text
409 CONFLICT
~~~

This is especially important for:

- conversation control;
- assignments;
- AI policies;
- workflows;
- billing configuration.

## 7. Error Taxonomy

Stable error codes should include:

~~~text
AUTHENTICATION_REQUIRED
FORBIDDEN
NOT_FOUND
VALIDATION_ERROR
CONFLICT
IDEMPOTENCY_CONFLICT
STALE_VERSION
RATE_LIMITED
UPSTREAM_UNAVAILABLE
INTERNAL_ERROR
~~~

Do not make client applications parse human-readable strings.

## 8. Asynchronous Resources

Long work returns an operation/run resource.

~~~json
{
  "operationId": "op_123",
  "status": "queued"
}
~~~

Polling endpoints return durable state rather than worker-memory status.

## 9. Bulk API

Bulk operations define:

- max item count;
- request size;
- per-item result;
- partial success semantics;
- idempotency;
- async execution;
- cancellation;
- export/download retention if applicable.

## 10. Resource Examples

### Customer

~~~text
GET /customers
GET /customers/{id}
POST /customers
PATCH /customers/{id}
~~~

### Conversation

~~~text
GET /conversations
GET /conversations/{id}
POST /conversations/{id}/messages
~~~

### Workflow

~~~text
GET /workflows
POST /workflows
POST /workflows/{id}/runs
~~~

The exact endpoint set remains versioned in OpenAPI.

## 11. API Sequence

~~~mermaid
sequenceDiagram
participant C as Client
participant API as API Layer
participant APP as Application
participant DB as Database
participant O as Outbox
C->>API: POST mutation
API->>API: Authenticate / resolve tenant
API->>APP: Command
APP->>DB: Transaction
APP->>O: Event in same transaction
DB-->>APP: Commit
APP-->>API: DTO
API-->>C: Response
~~~

External providers are not called inside the transaction unless a documented distributed boundary requires it.

## 12. Security

Every endpoint declares:

- auth mode;
- organization scope;
- permission;
- resource disclosure policy;
- rate-limit class;
- sensitive-data handling.

## 13. API Evolution

For breaking changes:

~~~text
introduce vNext
 -> migrate clients
 -> monitor old version
 -> deprecate
 -> remove
~~~

## 14. Tests

Contract suite should cover:

- request validation;
- status codes;
- error envelope;
- auth;
- tenant isolation;
- idempotency;
- pagination;
- optimistic concurrency;
- async operation state.

## 15. Acceptance

No public endpoint is considered production-ready until its complete request/response/error/concurrency/idempotency/security semantics are documented and tested.
