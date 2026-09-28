# Identity Domain — Implementation Specification

> Status: **Target implementation blueprint**

Identity separates human/service principals from organization membership and effective permissions.

## 1. Core Model

~~~mermaid
erDiagram
    USER ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ MEMBERSHIP : contains
    MEMBERSHIP }o--|| ROLE : uses
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : included
    MEMBERSHIP ||--o{ SCOPE_BINDING : limits
    SERVICE_PRINCIPAL ||--o{ SERVICE_PERMISSION : grants
~~~

## 2. User Record

User stores identity, not tenant authorization.

Conceptual fields:

~~~text
user_id
email/identity_handle
display_name
status
created_at
updated_at
~~~

There is no global tenant role field.

## 3. Membership

Membership represents access to one organization:

~~~text
membership_id
user_id
organization_id
status
role_id
version
created_at
updated_at
~~~

## 4. Authorization Calculation

Effective access is the intersection of:

~~~text
role permissions
INTERSECT scope
INTERSECT resource ownership
INTERSECT resource state
INTERSECT entitlement where applicable
~~~

## 5. Authorization Flow

~~~mermaid
flowchart TD
PRINCIPAL[Principal] --> MEMBERSHIP[Active Membership]
MEMBERSHIP --> ROLE[Role Permissions]
MEMBERSHIP --> SCOPE[Scope Bindings]
REQUEST[Resource Request] --> OWNERSHIP[Resource Ownership]
ROLE --> CHECK[Authorization]
SCOPE --> CHECK
OWNERSHIP --> CHECK
REQUEST --> CHECK
CHECK --> DECISION{Allow?}
DECISION -->|yes| USE[Application Service]
DECISION -->|no| DENY[Reject]
~~~

## 6. Service Principals

Examples:

~~~text
whatsapp-webhook
workflow-worker
ai-runtime
billing-reconciler
analytics-consumer
~~~

Each gets explicit permissions and organization/scope binding when tenant-specific.

## 7. Permission Vocabulary

Examples:

~~~text
customer.read
customer.write
conversation.read
conversation.send
conversation.assign
workforce.manage
ai.configure
ai.execute
tool.execute
quality.review
billing.read
billing.manage
integration.manage
organization.manage
~~~

Roles are reusable bundles, not the final authorization decision.

## 8. Membership Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> INVITED
    INVITED --> ACTIVE
    INVITED --> EXPIRED
    ACTIVE --> SUSPENDED
    SUSPENDED --> ACTIVE
    ACTIVE --> REVOKED
    REVOKED --> [*]
~~~

Invitation acceptance never implies organization-wide administrator access.

## 9. Credential Separation

Keep separate:

- browser/session credentials;
- public API keys;
- internal service credentials;
- provider credentials.

Each has distinct rotation/revocation behavior.

## 10. Organization Switching

For a multi-organization user:

~~~text
request target organization
 -> verify active membership
 -> resolve effective scope
 -> establish request tenant context
 -> query only inside that context
~~~

The browser cannot grant itself a membership.

## 11. Authorization Cache

If authorization is cached, the key needs all relevant inputs:

~~~text
principal
organization
role version
scope version
permission
resource type
resource identity when required
~~~

Membership/role changes invalidate relevant entries.

## 12. Privileged Operations

Require stronger controls where appropriate for:

- owner transfer;
- role changes;
- service principal creation;
- API key creation;
- provider credentials;
- bulk exports;
- billing administration.

## 13. Audit

Record:

~~~text
actor
organization
target principal
previous state
new state
action
timestamp
correlation_id
~~~

Do not place secrets in audit events.

## 14. Concurrency

Membership mutations are versioned.

Example:

~~~text
admin A revokes membership version 4
admin B updates role using version 4
=> conflict
~~~

This prevents stale administration from resurrecting access.

## 15. Cross-Domain Contracts

Tenancy owns organization identity.

Workforce represents operational members but does not grant authorization.

AI uses independent service/agent policy.

Billing permissions are separate.

Integrations use service identities.

## 16. Failure Modes

| Failure | Behavior |
|---|---|
| invalid credential | 401 |
| revoked membership | deny |
| missing permission | 403/404 per disclosure policy |
| invalid scope | deny |
| revoked service identity | reject work |
| stale authorization cache | refresh/revalidate |
| suspicious privileged action | audit/alert |

## 17. Security Tests

- cross-tenant read;
- role escalation;
- scope escalation;
- revoked membership;
- stale session after revocation;
- service principal overreach;
- API key after revocation;
- owner transfer race.

## 18. Acceptance

Authentication, membership, scope, permission, credential lifecycle and revocation must each be independently testable.
