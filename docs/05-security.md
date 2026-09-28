# OmniLinks Security Architecture

## Security invariants

1. Tenant A cannot access Tenant B data.
2. A user's role in one organization does not grant access in another.
3. Team-scoped permissions cannot escape the team boundary.
4. Platform access does not automatically grant tenant customer-data access.
5. AI output is never an authorization decision.
6. Tool/action execution is independently authorized.
7. High-risk actions require configured approval.
8. Secrets never appear in logs or ordinary API responses.

## Authorization flow

    identity
      -> organization membership
      -> operating scope
      -> permission
      -> resource policy
      -> business rule
      -> action

Frontend visibility is UX only. Backend authorization is the security boundary.

## Tenant isolation

Use:
- explicit organization ownership
- server-side authorization
- database constraints
- PostgreSQL RLS defense in depth
- automated cross-tenant tests

Never trust an organization ID supplied by the client.

## Platform plane

Platform administrators are separate from tenant members.

Privileged customer-data access, where operationally required, must be:
- explicitly granted
- time-limited where practical
- scoped
- audited

## AI security

Threats:
- prompt injection
- malicious retrieved documents
- untrusted tool output
- model-induced unsafe actions
- data exfiltration

Controls:
- separate system instructions from retrieved content
- tool allowlists
- schema validation
- authorization checks
- approval gates
- output validation
- secret redaction
- audit records
- retrieval permissions

## Webhook security

Validate:
- signature
- timestamp/replay protection where supported
- connection ownership
- event structure
- idempotency

Never execute business state changes before verification.

## Credential security

Credentials are:
- encrypted at rest
- scoped
- write-only from the UI after creation
- excluded from logs
- rotated where supported

Production credentials belong in a managed secret store.

## File security

For documents/media:
- size limits
- extension and content validation
- malware scanning where appropriate
- isolated processing
- signed/limited downloads
- no executable processing

## Logging

Default logging must exclude:
- message bodies
- access tokens
- API keys
- passwords
- payment secrets

Logs should prefer IDs, status codes, latency and operation names.

## Audit

Audit sensitive changes:
- membership
- roles/permissions
- channel credentials
- AI configuration
- action execution
- approval decisions
- data export/deletion
- billing state
- privileged access

Audit is separate from ordinary application logs.

## Security testing

Required:
- cross-tenant access tests
- role escalation tests
- malformed webhook tests
- replay/idempotency tests
- action authorization tests
- prompt/tool abuse tests
- file upload security tests
- secret scanning
- dependency/container scanning
