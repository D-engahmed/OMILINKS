# Coding Standards

> Status: **Target production engineering contract**

Coding standards preserve domain boundaries, security properties and maintainability as OMILINKS grows.

## 1. Architecture Rules

~~~mermaid
flowchart TB
HTTP[HTTP / Event Adapter] --> APP[Application Service]
APP --> DOMAIN[Domain Logic]
DOMAIN --> DATA[Data Access]
APP --> EVENT[Outbox / Events]
DATA --> PG[(PostgreSQL)]
EVENT --> BUS[Event Bus]
APP --> EXT[Provider Adapter]
EXT --> PROVIDER[External Provider]
~~~

Rules:

- routes/controllers stay thin;
- application services orchestrate use cases;
- domain modules own business invariants;
- repositories/data access own persistence;
- provider SDKs stay behind adapters;
- external input is validated at boundaries;
- frontend never accesses database internals.

## 2. TypeScript

Use strict TypeScript.

Prefer:

- discriminated unions for state machines;
- explicit boundary types;
- runtime validation for untrusted input;
- immutable/read-only structures where useful;
- narrow interfaces at module boundaries.

Avoid widespread untyped escape hatches.

## 3. Naming

Names express business meaning.

Prefer:

~~~text
ConversationAssignmentService
RoutingDecision
EntitlementCheck
~~~

over generic names such as:

~~~text
Manager
Helper
Utils
Service2
~~~

## 4. State Machines

Business state is explicit.

Example:

~~~text
ConversationControl
  HUMAN
  AI
  QUEUE
~~~

State transitions should live in a domain boundary, not be duplicated across UI/controllers/database hooks.

## 5. Validation

Validate:

- HTTP body;
- query;
- headers;
- webhooks;
- provider payloads;
- job payloads;
- tool arguments;
- imported documents.

Validation occurs before side effects.

## 6. Error Handling

Never silently swallow errors.

Errors are:

- handled intentionally;
- translated at boundaries;
- logged with safe structured context;
- assigned stable categories where externally visible.

Never include secrets in errors.

## 7. Transactions

Use transactions for operations that must commit together.

Typical case:

~~~text
business mutation
+
outbox record
~~~

Do not hold database transactions open during LLM/provider network calls.

## 8. Concurrency

Use the correct mechanism for the invariant:

- optimistic versions;
- unique constraints;
- atomic updates;
- row locks;
- idempotency records.

A disabled UI button is not a concurrency control.

## 9. Provider Adapters

Canonical adapter interfaces should expose behavior such as:

~~~text
verifyWebhook
normalizeInbound
sendMessage
normalizeDelivery
checkHealth
~~~

Provider SDK types remain inside integration boundaries.

## 10. Logging

Structured logs should include:

- request ID;
- correlation ID;
- operation;
- safe organization context;
- outcome;
- latency.

Do not log:

- passwords;
- API keys;
- bearer tokens;
- provider secrets;
- unnecessary full customer payloads.

## 11. Configuration

Validate configuration at startup.

Required configuration fails fast.

Environment-specific assumptions remain outside domain logic.

## 12. Tests

New business behavior requires tests.

Security-sensitive changes require negative tests.

Provider adapters require contract/integration tests.

## 13. Dependency Discipline

Review:

- security;
- license;
- maintenance;
- runtime/bundle impact;
- transitive dependencies.

Lockfile changes are intentional and reviewable.

## 14. Documentation

When observable behavior changes, update the affected requirement, domain contract, API/event contract and tests.

## 15. Acceptance Criteria

- Business logic lives inside domain/application boundaries.
- Provider SDKs do not leak into domain code.
- Untrusted input is validated.
- Concurrency is explicit.
- Errors are observable and safe.
- Security invariants have tests.
