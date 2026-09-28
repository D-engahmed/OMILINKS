# API Authentication and Authorization

> Status: **Target production API contract**

Authentication establishes the principal making a request. Authorization establishes what that principal may do inside a specific organization and resource scope.

## 1. Authentication Modes

| Caller | Mechanism |
|---|---|
| Operations web | secure browser session / short-lived access context |
| Public API client | scoped API key or OAuth-style credential |
| Internal worker | service principal credential |
| Provider webhook | provider signature/token verification |
| Scheduled job | service principal |
| AI runtime | internal service identity + execution context |

One credential format must not accidentally become the universal trust mechanism.

## 2. User Session

The session establishes user identity, session identity, authentication time, expiry, authentication strength, and available organization memberships.

The session is not a permanent copy of authorization. High-risk permission changes must become effective without waiting indefinitely for an old authorization snapshot.

## 3. Authentication Pipeline

~~~mermaid
sequenceDiagram
    participant C as Client
    participant E as API Edge
    participant A as Identity
    participant T as Tenant Resolver
    participant Z as Authorization
    participant U as Use Case
    C->>E: HTTPS request + credential
    E->>A: Validate credential
    A-->>E: Principal
    E->>T: Resolve organization and scope
    T-->>E: Tenant context
    E->>Z: Authorize operation
    Z-->>E: Allow or deny
    E->>U: Execute
    U-->>E: Result
    E-->>C: Response
~~~

## 4. Tenant Resolution

Tenant context is derived from server-known membership or an integration binding.

A request body containing an organization identifier is not an authorization grant.

For a human with multiple memberships:

1. verify the membership is active;
2. resolve the permitted scope;
3. execute only inside that organization.

For a machine credential:

- bind the credential to explicit organizations/scopes;
- reject requests outside that binding.

## 5. Authorization

Every protected request evaluates:

~~~text
principal
+ organization
+ permission
+ resource ownership
+ scope
+ resource state
+ entitlement
~~~

Example for sending a conversation message:

~~~text
authenticate
 -> resolve organization
 -> load conversation in organization scope
 -> check conversation.send
 -> check conversation control state
 -> check channel capability
 -> check entitlement
 -> create message
 -> enqueue delivery
~~~

## 6. HTTP Error Semantics

| Condition | Typical status |
|---|---|
| unauthenticated | 401 |
| authenticated but forbidden | 403 |
| resource intentionally undiscoverable | 404 |
| validation problem | 400 |
| state/version/idempotency conflict | 409 |
| rate limited | 429 |

The API may intentionally return 404 instead of 403 when revealing the existence of another tenant's object creates information leakage.

## 7. Service Principals

A service principal contains:

- principal ID;
- owner;
- purpose;
- allowed organizations/scopes;
- permissions;
- credential status;
- rotation metadata.

Example:

~~~text
webhook.whatsapp
 -> verify inbound event
 -> persist normalized event
 -> enqueue processing
~~~

It should not automatically have billing administration or unrestricted customer export.

## 8. Credential Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> ISSUED
    ISSUED --> ACTIVE
    ACTIVE --> ROTATION_PENDING
    ROTATION_PENDING --> ACTIVE
    ACTIVE --> REVOKED
    ACTIVE --> EXPIRED
    REVOKED --> [*]
    EXPIRED --> [*]
~~~

Credential metadata is stored separately from credential material.

## 9. API Keys

Public API keys should be:

- scoped;
- revocable;
- rate-limited;
- attributable;
- hashed at rest where possible;
- shown only at issuance when practical.

Do not store recoverable plaintext keys merely to support later display.

## 10. High-Risk Authentication

Require recent or stronger authentication for:

- owner transfer;
- billing configuration;
- provider credential changes;
- API key creation;
- bulk export;
- AI tool enablement;
- destructive actions.

## 11. Browser Security

Browser authentication must defend against CSRF, XSS token exposure, session fixation, insecure redirect handling, and credential leakage through URLs.

Use secure cookie controls appropriate to the session architecture.

## 12. Rate Limiting

Rate limiting can be layered:

~~~text
edge or IP
 -> credential
 -> organization
 -> endpoint class
 -> expensive-operation class
~~~

Authentication, search, exports, AI and bulk operations should have separate protection.

## 13. Audit

Audit authentication success/failure, session revocation, membership changes, role/permission changes, API key changes, privileged exports, and sensitive configuration changes.

Never log passwords, access tokens, API keys or provider secrets.

## 14. Acceptance Criteria

- A user cannot access an organization without an active membership.
- Organization context is derived server-side.
- Service principals have narrow permissions.
- High-risk mutations can require stronger authentication.
- Authorization is checked at the resource boundary.
- Authentication and authorization telemetry contains no secret material.
