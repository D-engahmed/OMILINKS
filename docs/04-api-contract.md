# OmniLinks API Contract

## Base

Public API version:

    /api/v1

Webhook endpoints are versioned and isolated from user commands.

## Request context

Every request must establish:
- requestId
- authenticated principal
- organization
- optional client/program/sector/team scope
- permission context

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
