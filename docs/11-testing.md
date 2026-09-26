# OmniLinks Testing Strategy

## Test layers

Unit tests
- domain rules
- state machines
- permission decisions
- routing
- billing calculations
- identity matching

Integration tests
- PostgreSQL repositories
- transactions
- RLS
- migrations
- outbox
- idempotency

Contract tests
- API schemas
- frontend/API compatibility
- webhook contracts

Security tests
- cross-tenant access
- role escalation
- scope leakage
- platform/tenant separation
- action authorization

Channel tests
- signatures
- duplicates
- malformed payloads
- delivery failure
- retry
- media
- outbound idempotency

AI tests
- provider adapter behavior
- retrieval permissions
- tool authorization
- approval gates
- evaluation datasets

Workflow tests
- trigger selection
- branching
- retries
- duplicate triggers
- delayed steps
- approval paths
- immutable versions

E2E
The critical journey is:

    sign in
      -> organization
      -> team
      -> channel
      -> customer message
      -> conversation
      -> assignment
      -> reply
      -> resolution
      -> usage/analytics

## Quality gates

CI blocks merges for:
- lint failures
- type failures
- required test failures
- build failures
- prohibited secrets
- invalid migrations
- security checks above policy threshold

## Data

Synthetic data is the default.

Production customer data must not be copied into development/test environments without explicit controls.

## Definition of done

A feature is incomplete until:
- happy path works
- failure paths are specified
- authorization paths are tested
- retries/idempotency are tested where relevant
- observability exists
- documentation is updated
