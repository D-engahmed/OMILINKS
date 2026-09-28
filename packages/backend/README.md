# Backend Foundation

The backend now contains the first executable core slice.

## Runtime boundary

~~~text
HTTP
 -> Application Services
 -> Domain Rules
 -> Store
~~~

The MemoryStore is the deterministic runtime used for tests and local development.

The PostgreSQL migration defines the same tenant/identity/customer/conversation/workforce model for the production persistence layer.

## Implemented endpoints

~~~text
GET  /health
GET  /ready
GET  /api/v1

POST /api/v1/auth/signup
GET  /api/v1/organizations/me

GET   /api/v1/customers
POST  /api/v1/customers
GET   /api/v1/customers/:id
PATCH /api/v1/customers/:id

GET  /api/v1/conversations
POST /api/v1/conversations
GET  /api/v1/conversations/:id
POST /api/v1/conversations/:id/messages

POST /api/v1/workforce/members
POST /api/v1/workforce/assignments
~~~

## Invariants implemented

- organization context is derived from authenticated membership;
- customer resources are tenant-scoped;
- external customer identities are deduplicated within provider-account scope;
- stale customer writes are rejected;
- assignment requires the current conversation version;
- one active assignment exists per conversation in the model;
- assignment switches conversation control to human;
- request bodies have a bounded size;
- protected endpoints require bearer authentication.

## Persistence status

The runtime uses the Store interface so PostgreSQL can replace MemoryStore without changing the application/domain contracts.

Next database milestone:

1. PostgreSQL adapter;
2. migration runner;
3. integration test environment;
4. transactional outbox publisher;
5. persistent idempotency implementation.

The current code intentionally does not claim that PostgreSQL persistence is already wired.
