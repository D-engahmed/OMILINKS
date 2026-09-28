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

## Security invariants implemented

- organization context is derived from authenticated membership;
- customer resources are tenant-scoped;
- external customer identities are deduplicated within provider-account scope;
- stale customer writes are rejected;
- assignment requires the current conversation version;
- one active assignment exists per conversation in the model;
- assignment switches conversation control to human;
- request bodies have a bounded size;
- protected endpoints require bearer authentication.

## Explicit current-slice limitations

This is the first vertical slice, not the completed production identity system.

Current limitations:

- only the first active membership is selected during authentication;
- sessions are stored in MemoryStore and are non-expiring;
- PostgreSQL is represented by migration/schema, not yet wired into the runtime;
- outbox publication is not yet implemented;
- real identity-provider login/password/MFA is not yet implemented.

These are deliberate next milestones, not hidden capabilities.

## Persistence boundary

The Store interface is the seam for replacing MemoryStore with PostgreSQL without changing application/domain contracts.

Next database milestone:

1. PostgreSQL adapter;
2. migration runner;
3. integration test environment;
4. transactional outbox publisher;
5. persistent idempotency implementation.
