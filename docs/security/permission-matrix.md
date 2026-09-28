# Permission Matrix — Implementation Specification

> Status: **Target authorization blueprint**

## 1. Effective Authorization

~~~text
principal
+ membership/service binding
+ permission
+ organization
+ scope
+ resource ownership
+ resource state
+ entitlement
-> decision
~~~

## 2. Permission Vocabulary

~~~text
organization.manage
membership.manage
customer.read
customer.write
conversation.read
conversation.send
conversation.assign
workforce.manage
routing.manage
ai.configure
ai.execute
tool.execute
knowledge.manage
workflow.manage
quality.review
quality.manage
billing.read
billing.manage
integration.manage
export.execute
~~~

Permissions should be stable identifiers used by code and tests.

## 3. Baseline Role Matrix

| Capability | Owner | Admin | Supervisor | Agent | QA | Billing | Integration | AI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| organization.manage | Y | Y | - | - | - | - | - | - |
| membership.manage | Y | Y | - | - | - | - | - | - |
| customer.read | Y | Y | scoped | scoped | scoped | - | scoped | policy |
| customer.write | Y | Y | scoped | scoped | - | - | scoped | policy |
| conversation.read | Y | Y | scoped | scoped | scoped | - | scoped | policy |
| conversation.send | Y | Y | Y | Y | - | - | policy | policy |
| conversation.assign | Y | Y | Y | - | - | - | - | policy |
| workforce.manage | Y | Y | scoped | - | - | - | - | - |
| routing.manage | Y | Y | scoped | - | - | - | - | - |
| ai.configure | Y | Y | scoped | - | - | - | - | - |
| ai.execute | Y | Y | scoped | - | - | - | - | policy |
| tool.execute | Y | Y | policy | - | - | policy | policy | policy |
| knowledge.manage | Y | Y | scoped | - | - | - | scoped | policy |
| workflow.manage | Y | Y | scoped | - | - | - | - | - |
| quality.review | Y | Y | Y | - | Y | - | - | policy |
| billing.read | Y | Y | - | - | - | Y | - | - |
| billing.manage | Y | scoped | - | - | - | Y | - | - |
| integration.manage | Y | Y | - | - | - | - | Y | - |
| export.execute | Y | scoped | scoped | - | - | scoped | scoped | policy |

Custom tenant roles may narrow access but cannot bypass platform security controls.

## 4. Scope Dimensions

- organization;
- client account;
- program;
- sector;
- team;
- site.

~~~mermaid
flowchart LR
ROLE[Role] --> PERM[Permission]
MEMBERSHIP[Membership] --> SCOPE[Scope Binding]
PERM --> CHECK[Authorization]
SCOPE --> CHECK
RESOURCE[Resource Ownership] --> CHECK
CHECK --> DECISION[Allow / Deny]
~~~

## 5. Scope Evaluation

Example for team-scoped Agent:

~~~text
permission = conversation.read
required team = team_7
membership scope = team_7
conversation team = team_7
=> eligible
~~~

A different team is denied.

## 6. Deny by Default

Missing policy state is deny for protected operations.

Never use:

~~~text
unknown scope -> organization-wide fallback
~~~

## 7. AI Authorization

AI access is the intersection of:

~~~text
platform
+ tenant
+ agent
+ tool
+ conversation
+ resource
~~~

Configuring an agent does not transfer the administrator's role.

## 8. Service Principal Permissions

Example:

~~~text
whatsapp-webhook:
  integration.receive
  conversation.ingest
  event.publish

billing-reconciler:
  billing.read_provider_state
  billing.reconcile
  usage.record
~~~

Do not give machines generic administrator roles.

## 9. Privileged Operations

Extra controls for:

- owner transfer;
- role/permission changes;
- credential changes;
- API key creation;
- export;
- billing override;
- destructive actions.

## 10. Authorization Cache

A safe cache key may require:

~~~text
principal
organization
role_version
scope_version
permission
resource_type
resource_id
~~~

Invalidate on membership/role/scope changes.

## 11. Audit

Record actor, organization, operation, target, decision, policy version, timestamp and correlation ID.

## 12. Test Matrix

- horizontal escalation;
- vertical escalation;
- scope escape;
- stale revoked membership;
- service principal overreach;
- AI privilege inheritance;
- privileged action without required auth;
- cross-tenant resource ID.

## 13. Acceptance

Every permission has a defined principal type, organization boundary, scope semantics, deny behavior and automated tests.
