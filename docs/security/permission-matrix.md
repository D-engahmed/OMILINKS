# Permission Matrix

> Status: **Target production authorization contract**

## 1. Authorization Model

Authorization is:

~~~text
Principal
  + Membership
  + Permission
  + Scope
  + Resource Ownership
  + Resource State
  + Entitlement
  -> decision
~~~

Roles are bundles of permissions. They are not themselves the final authorization decision.

## 2. Role Semantics

Baseline roles:

- Owner;
- Admin;
- Supervisor;
- Agent;
- QA;
- BillingAdmin;
- IntegrationAdmin;
- AIOperator;
- ServicePrincipal.

A tenant can define additional roles without weakening platform-required security controls.

## 3. Baseline Matrix

| Capability | Owner | Admin | Supervisor | Agent | QA | Billing | Integration | AI |
|---|---|---|---|---|---|---|---|---|
| organization.manage | yes | yes | no | no | no | no | no | no |
| membership.manage | yes | yes | no | no | no | no | no | no |
| customer.read | yes | yes | scoped | scoped | scoped | no | scoped | policy |
| customer.write | yes | yes | scoped | scoped | no | no | no | policy |
| conversation.read | yes | yes | scoped | scoped | scoped | no | scoped | policy |
| conversation.send | yes | yes | yes | yes | no | no | policy | policy |
| conversation.assign | yes | yes | yes | no | no | no | no | policy |
| workforce.manage | yes | yes | scoped | no | no | no | no | no |
| ai.configure | yes | yes | scoped | no | no | no | no | no |
| ai.run | yes | yes | scoped | no | no | no | no | policy |
| tool.execute | yes | yes | approved | no | no | policy | policy | policy |
| billing.read | yes | yes | no | no | no | yes | no | no |
| billing.manage | yes | scoped | no | no | no | yes | no | no |
| integrations.manage | yes | yes | no | no | no | no | yes | no |
| quality.manage | yes | yes | yes | no | yes | no | no | policy |

"Scoped" means only inside effective resource scope. "Policy" means AI/tool authorization adds another restriction layer.

## 4. Scope Dimensions

Permissions can be limited by:

- organization;
- client account;
- program;
- sector;
- team;
- site.

~~~mermaid
flowchart TB
PERM[Permission] --> SCOPE[Scope Binding]
SCOPE --> ORG[Organization]
SCOPE --> CLIENT[Client]
SCOPE --> PROGRAM[Program]
SCOPE --> SECTOR[Sector]
SCOPE --> TEAM[Team]
SCOPE --> SITE[Site]
~~~

A broad scope cannot be inferred from a narrow assignment.

## 5. Authorization Decision

~~~mermaid
flowchart LR
USER[Principal] --> MEMBERSHIP[Membership]
MEMBERSHIP --> ROLE[Role]
ROLE --> PERMISSION[Permission]
MEMBERSHIP --> SCOPE[Scope]
RESOURCE[Resource] --> OWNERSHIP[Ownership]
PERMISSION --> CHECK[Authorization Check]
SCOPE --> CHECK
OWNERSHIP --> CHECK
RESOURCE --> CHECK
CHECK --> DECISION{Allow?}
~~~

## 6. Privilege Separation

Do not make one administrator role responsible for all sensitive areas.

Recommended separation:

- BillingAdmin for financial settings;
- IntegrationAdmin for provider credentials;
- AIOperator for AI policy;
- QA for evaluation;
- Supervisor for operational workforce.

This reduces blast radius.

## 7. Service Principals

A service principal uses the same permission system but receives minimal capabilities.

Example:

~~~text
whatsapp.webhook
 -> integration.webhook.receive
 -> conversation.message.ingest
 -> event.publish
~~~

It does not receive:

~~~text
billing.manage
organization.manage
customer.export
~~~

unless explicitly required and separately approved.

## 8. AI Authorization

The AI agent permission set is the intersection of:

~~~text
platform policy
+
tenant policy
+
agent tool policy
+
conversation scope
+
resource authorization
~~~

The human who configured an AI agent does not transfer their role to the agent.

## 9. Privileged Operations

Require stronger controls and audit for:

- owner transfer;
- role/permission changes;
- tenant-wide exports;
- API key creation;
- provider credential changes;
- AI tool enablement;
- billing overrides;
- destructive operations.

## 10. Deny by Default

If a permission is missing or scope cannot be resolved, the decision is deny.

Do not implement fallback such as:

~~~text
scope unknown -> use organization-wide access
~~~

## 11. Authorization Caching

Caches may optimize repeated checks, but must have:

- bounded TTL;
- invalidation on membership changes;
- tenant-safe keys;
- stronger revalidation for high-risk actions.

## 12. Audit

Authorization-sensitive mutations record:

- actor;
- organization;
- permission;
- resource;
- scope;
- result;
- policy/version;
- correlation ID.

## 13. Acceptance Criteria

- Missing permissions deny.
- Scope cannot be widened by client input.
- Roles do not cross organizations.
- AI does not inherit human privileges.
- Service principals are least-privilege.
- Privileged changes are auditable.
- High-risk authorization uses fresh enough policy state.
