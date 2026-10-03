# Backend Foundation

The backend now contains the first executable core slice.

## Runtime boundary

~~~text
HTTP
 -> Application Services
 -> Domain Rules
 -> Store
~~~

The MemoryStore is the deterministic runtime used for tests and local development without a database. The PostgresStore is the persistent runtime and is selected when DATABASE_URL is set.

The PostgreSQL migrations (0001 core schema, 0002 row-level security and the least-privilege omnilinks_app role) define the production persistence layer. Run them with `pnpm --filter @workspace/backend migrate`.

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

- the only identity provider is `dev`, which trusts the claimed email and is therefore NOT authentication; it refuses to start in production, so a production deployment is blocked until a real provider adapter exists;
- there is no login rate limiting, password or MFA handling, invite flow, or membership management endpoint (memberships can currently be created only through the store);
- sessions expire (SESSION_TTL_SECONDS, default 12 h; enforced NOT NULL in the database) and can be revoked with POST /api/v1/auth/logout, but there is no refresh or session listing;
- a user in several organizations must send X-Organization-Id on every request; with one membership the header is optional;
- authorization is role-based within one organization. There is no client-account/program scoping; that needs a data model and query filtering, not just a parameter on authorize(), so it is deferred until a real BPO requirement exists;
- row-level security covers data-plane tables only (customers, conversations, messages, workforce, assignments, outbox); users, sessions, memberships, organizations and idempotency_keys are control-plane tables protected by application code;
- the application must connect as omnilinks_app (a superuser or table owner bypasses RLS in practice; migrations FORCE it for owners but not superusers);
- outbox publication is not yet implemented;
- real identity-provider login/password/MFA is not yet implemented.

These are deliberate next milestones, not hidden capabilities.

## Persistence boundary

The Store interface is async. The same test suite runs against MemoryStore and PostgresStore (set TEST_DATABASE_URL to an admin connection for a scratch database to include the PostgreSQL variants; without it they are reported as skipped).

Next database milestones:

1. transactional outbox write on message creation, then a publisher;
2. inbound messages and client/provider message-id deduplication (the schema has the columns but no unique index, and the code has no inbound path yet);
3. a real identity-provider adapter, invites, and login rate limiting.

## AI pipeline (conversation core)

Implemented and tested against both stores (`src/application/pipeline.ts`, `src/ai/`):

- `ConversationPipeline.receiveInbound` resolves the customer, finds or creates the one active conversation for that customer and channel, and stores the message idempotently (provider message id, or client message id). Duplicate events create nothing and trigger no AI.
- `respondWithAi` runs only when the conversation is AI-controlled: explicit human request, then knowledge retrieval, then a relevance gate, then the model, then a strict JSON answer that must cite retrieved knowledge. Any failure becomes a handoff: a queueable `handoffs` row, a customer-facing notice, and the conversation moves to `queue`.
- Every AI decision writes one `ai_runs` row (provider, model, prompt version, retrieved chunks with scores and citations, tokens, latency, outcome, reason) in the same transaction as the reply or handoff.
- A reply is written only if the conversation is still AI-controlled at the same control version, checked under a row lock. A human takeover during a slow model call makes the late reply a recorded `DISCARDED_STALE` run.
- Knowledge: tenant-scoped documents and chunks (RLS), uploaded as text through `/api/v1/knowledge/documents`, retrieved with in-process BM25 plus a coverage gate.

Not implemented, and not to be assumed:

- **No HTTP entry point for customer messages.** The widget and WhatsApp adapters do not exist yet; they must call `receiveInbound`/`processInbound` with an organization id taken from their own channel credentials. Nothing wires the pipeline or a model into `server.ts`.
- **The model adapter is untested against a live API.** `AnthropicGateway` was written from the public API shape and exercised only with a mocked `fetch`. Chat and embeddings providers are separate decisions; there are no embeddings yet.
- **Retrieval quality is unmeasured, especially for Egyptian Arabic.** Normalization and light stemming only unify spelling variants. `evaluateRetrieval` exists to measure recall and MRR, but no real labeled questions have been run through it. The coverage threshold (default 0.5) is uncalibrated.
- **The human-request and handoff-notice wording are heuristics and draft copy.** The Arabic copy needs a native Egyptian review.
- **Retrieval reads every active chunk of the tenant per message.** That is fine for a pilot-sized knowledge base and is the first thing to replace (FTS or vectors) behind the `Retriever` interface.
- **The AI step runs inline, with no queue or worker.** Several quick messages from one customer are each answered separately; there is no debounce. The outbox is still unused.
- No actions or tools, no cost calculation (tokens are recorded), no groundedness check beyond the citation requirement (a model can cite the wrong chunk).
