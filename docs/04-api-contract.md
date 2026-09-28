# OmniLinks API Contract

## Base

Public API version:

    /api/v1

Webhook endpoints are versioned and isolated from user commands.

## Request context

Every request must establish the following context, except for the login bootstrap described below:
- requestId
- authenticated principal
- organization
- optional client/program/sector/team scope
- permission context

### Login bootstrap

`POST /auth/login` is exempt from requiring an existing authenticated principal, organization, or permission context on entry; it still requires a `requestId`.

1. The server authenticates the credentials or validates an external identity token, then loads eligible organization memberships for the verified identity from trusted server-side identity and membership data.
2. With one eligible membership and no organization selection, the server selects that organization. With multiple eligible memberships and no selection, login returns an organization-selection-required result containing only that identity's eligible organizations, without issuing a tenant session or access token. The client repeats `POST /auth/login` with authentication proof and its selected `organizationId`.
3. A client-supplied `organizationId` is only a selection hint. The server must authenticate the identity and validate its membership in the selected organization against trusted data on every login attempt. No eligible membership or an invalid selection causes login to fail without granting tenant access.
4. Only after membership validation does the server establish the authenticated principal, organization, and membership-scoped permission context and issue a session or access token bound to that context. Subsequent protected requests require this context.

## Responses

Success:

    {
      "data": {},
      "requestId": "req_..."
    }

Collection:

    {
      "data": [],
      "pagination": {
        "nextCursor": "...",
        "hasMore": true
      },
      "requestId": "req_..."
    }

Error:

    {
      "error": {
        "code": "FORBIDDEN",
        "message": "Operation is not permitted.",
        "requestId": "req_..."
      }
    }

Do not expose raw database/provider exception messages.

## Resource surface

Authentication
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me

Organizations and access
- GET/PATCH /organizations/:id
- GET /organizations/:id/members
- POST /organizations/:id/invitations
- GET /roles
- GET /permissions

Commercial hierarchy
- GET/POST /client-accounts
- GET/PATCH /client-accounts/:id
- GET/POST /programs
- GET/PATCH /programs/:id
- GET/POST /sectors
- GET/PATCH /sectors/:id
- GET/POST /teams
- GET/PATCH /teams/:id

Workforce
- GET/POST /workforce
- GET/PATCH /workforce/:id
- GET /queues
- POST /assignments

Customers and conversations
- GET/POST /customers
- GET/PATCH /customers/:id
- GET /customers/:id/identities
- GET/POST /conversations
- GET/PATCH /conversations/:id
- POST /conversations/:id/messages
- POST /conversations/:id/assign
- POST /conversations/:id/escalate
- POST /conversations/:id/resolve

AI and knowledge
- GET/POST /ai-agents
- GET/PATCH /ai-agents/:id
- POST /ai-agents/:id/test
- GET /ai-runs/:id
- GET/POST /knowledge-bases
- POST /knowledge-bases/:id/sources
- POST /knowledge-sources/:id/reindex

Actions and workflows
- GET /actions
- POST /actions/:id/execute
- GET /approval-requests
- POST /approval-requests/:id/approve
- POST /approval-requests/:id/reject
- GET/POST /workflows
- GET/PATCH /workflows/:id
- POST /workflows/:id/publish
- POST /workflows/:id/test

Analytics and billing
- GET /analytics/operations
- GET /analytics/workforce
- GET /analytics/ai
- GET /analytics/usage
- GET /billing/subscription
- GET /billing/usage
- GET /billing/invoices

## Authorization

Authorization is evaluated before returning protected resource details.

For resources outside the user's security scope, returning a not-found response may be preferable to revealing resource existence. This must be consistent.

## Pagination

Use cursor pagination for messages, conversations, events, audits and usage records.

Server-side maximum page size is mandatory.

## State transitions

Sensitive state changes use explicit commands rather than unrestricted PATCH.

Examples:
- assign
- escalate
- resolve
- publish
- approve
- reject

## Idempotency

Retryable commands should accept Idempotency-Key.

The server must return the same logical result for a repeated key and matching request.

## Webhooks

Webhook processing:
1. verify signature
2. validate provider connection
3. deduplicate
4. persist durable inbound event
5. acknowledge promptly
6. process asynchronously

## API evolution

Breaking semantic or structural changes require a version or compatibility migration.

Contract changes require tests and documentation updates.
