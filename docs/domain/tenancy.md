# Tenancy Domain — Implementation Specification

> Status: **Target implementation blueprint**

The Tenancy domain is the root ownership model for organizations, BPO client accounts, programs, sectors, teams, sites and memberships.

## 1. Aggregate Boundary

~~~text
Organization
  -> ClientAccount
  -> Program
  -> Sector
  -> Team
  -> Site
~~~

Membership is associated with Organization while authorization is defined by Identity.

## 2. Relational Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ CLIENT_ACCOUNT : owns
    ORGANIZATION ||--o{ PROGRAM : owns
    CLIENT_ACCOUNT ||--o{ PROGRAM : scopes
    PROGRAM ||--o{ SECTOR : contains
    SECTOR ||--o{ TEAM : contains
    ORGANIZATION ||--o{ SITE : owns
    ORGANIZATION ||--o{ MEMBERSHIP : has
~~~

Every tenant-owned table should expose organization_id unless there is a deliberate architectural reason not to.

## 3. Organization Record

Minimum fields:

~~~text
id
slug
name
status
created_at
updated_at
version
closed_at
~~~

Recommended uniqueness:

~~~text
id
slug within its public routing namespace
~~~

## 4. Organization Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> PROVISIONING
    PROVISIONING --> ACTIVE
    PROVISIONING --> FAILED
    FAILED --> PROVISIONING
    ACTIVE --> SUSPENDED
    SUSPENDED --> ACTIVE
    ACTIVE --> CLOSING
    SUSPENDED --> CLOSING
    CLOSING --> CLOSED
~~~

Transitions are implemented in one domain/application boundary.

## 5. Atomic Provisioning

Tenant creation should be one application use case.

~~~text
BEGIN
  create organization
  create owner membership
  create required roles/permissions
  create default site when required
  create subscription/trial state
  create organization settings
  create provisioning outbox event
COMMIT
~~~

External email/payment/provider calls happen after commit.

## 6. Idempotency

Provisioning needs a semantic identity such as a signup request ID.

Repeated provisioning attempts return the prior result or deterministic conflict.

A retry must never create a second Organization for the same logical signup.

## 7. BPO Hierarchy

BPO mode:

~~~text
Organization
 -> ClientAccount
    -> Program
       -> Sector
          -> Team
~~~

Direct-business mode:

~~~text
Organization
 -> Program
    -> Sector
       -> Team
~~~

Both modes use one authorization architecture.

## 8. Ownership Consistency

Example invariant:

~~~text
team.organization_id
==
team.sector.organization_id
~~~

If organization_id is denormalized on children for isolation performance, every mutation validates parent/child consistency.

## 9. Scope Binding

Supported scopes:

- organization;
- client account;
- program;
- sector;
- team;
- site.

Scope narrows access. Scope does not grant permission by itself.

## 10. Commands

Conceptual commands:

~~~text
CreateOrganization
ActivateOrganization
SuspendOrganization
ResumeOrganization
CloseOrganization
CreateClientAccount
CreateProgram
CreateSector
CreateTeam
CreateSite
MoveTeam
~~~

Every command carries actor, organization and correlation context.

## 11. Queries

Examples:

~~~text
GetOrganizationForPrincipal
ListAccessiblePrograms
ListTeamsForScope
GetOrganizationHierarchy
GetOrganizationSettings
~~~

All tenant queries include explicit organization/scope conditions.

## 12. Concurrency

Hierarchy mutations use version checking or transactional locking.

Example:

~~~text
admin A reads team version 7
admin B changes team -> version 8
admin A writes version 7
=> 409 CONFLICT
~~~

Never silently overwrite.

## 13. Close Semantics

Closing is a workflow:

~~~text
ACTIVE
 -> CLOSING
 -> block new business writes
 -> drain/stop asynchronous work by policy
 -> disable integrations
 -> close billing state
 -> CLOSED
~~~

Historical data follows retention policy.

## 14. Failure Modes

| Failure | Behavior |
|---|---|
| duplicate provisioning | return existing outcome |
| parent/child mismatch | reject transaction |
| stale hierarchy write | conflict/re-evaluate |
| suspended tenant | capability-specific denial |
| closed tenant | reject new business writes |
| missing defaults | remain unusable until repaired |
| provisioning worker failure | resume from durable state |

## 15. Events

Key events:

~~~text
organization.created
organization.activated
organization.suspended
organization.closed
organization.hierarchy.changed
~~~

Events contain tenant, actor and correlation context.

## 16. Security Test Vectors

- Organization A access from Organization B;
- program scope escape;
- team scope escalation;
- ClientAccount spoofing;
- organization ID tampering;
- suspended tenant mutation;
- replay under incorrect tenant.

## 17. Acceptance

A tenancy implementation is complete only when ownership, scope, lifecycle, concurrency and authorization boundaries are independently testable.
