# Tools Domain

> Status: **Target production domain contract**

The Tools domain defines what executable capabilities exist and under what policies AI agents and workflows may use them. Execution is implemented by the AI Tool Runtime.

## 1. Why Tools Are a Domain

An AI platform becomes unsafe when model output can directly call arbitrary infrastructure.

OMILINKS uses a controlled capability model:

~~~text
ToolDefinition
  -> ToolVersion
    -> ToolPolicy
      -> Tool Runtime
        -> Domain / Provider Operation
~~~

A model can request a tool, but the request is not authorization.

## 2. Core Entities

| Entity | Responsibility |
|---|---|
| ToolDefinition | stable business capability identity |
| ToolVersion | immutable executable contract |
| ToolPolicy | allowed agents, scopes and risk rules |
| ToolInvocation | execution and audit record |
| CredentialRef | reference to secret material |
| ApprovalRequest | human approval for high-risk work |
| ToolAdapter | provider/infrastructure boundary |

## 3. Tool Lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> TESTING
    TESTING --> PUBLISHED
    PUBLISHED --> DISABLED
    DISABLED --> PUBLISHED
    PUBLISHED --> RETIRED
    DISABLED --> RETIRED
~~~

Published tool versions are immutable. Breaking behavior requires a new version.

## 4. Tool Definition Contract

A published tool should specify:

- stable tool ID;
- version;
- human-facing description;
- model-facing description;
- input schema;
- output schema;
- side-effect class;
- risk tier;
- required permissions;
- required entitlement;
- timeout;
- retry policy;
- idempotency strategy;
- implementation adapter;
- audit requirements.

This metadata exists so unsafe defaults are visible before the tool reaches an AI agent.

## 5. Side-Effect Classes

| Class | Example | Default retry |
|---|---|---|
| read | lookup order | usually safe |
| write | create ticket | idempotency required |
| external | send message | provider semantics / reconciliation |
| destructive | delete account | approval or strict policy |

## 6. Authorization Pipeline

~~~mermaid
flowchart TD
    REQUEST[Tool Request] --> EXISTS[Tool Exists + Active]
    EXISTS --> VERSION[Resolve Tool Version]
    VERSION --> TENANT[Resolve Organization + Scope]
    TENANT --> AGENT[Check Agent Policy]
    AGENT --> RESOURCE[Check Resource Ownership]
    RESOURCE --> PERM[Check Permission]
    PERM --> ENT[Check Entitlement]
    ENT --> RISK[Evaluate Risk / Approval]
    RISK --> EXEC[Executable]
~~~

Any failed hard constraint stops execution.

## 7. Tenant Resource Protection

A tool request such as:

~~~json
{
  "tool": "customer.lookup",
  "customer_id": "cust_123"
}
~~~

must resolve the customer through tenant-scoped data access.

~~~text
cust_123 -> organization X
run      -> organization Y
X != Y
=> DENY
~~~

A model-supplied organization identifier can never override the requesting execution context.

## 8. Tool Versioning

Breaking input/output semantics create a new version.

~~~text
ticket.create v1
ticket.create v2
~~~

Historical invocation records retain the exact version used.

## 9. Approval

High-risk tools may pause execution for human approval.

~~~mermaid
sequenceDiagram
participant M as Model
participant R as Tool Runtime
participant A as Approval Service
participant H as Human
participant D as Domain
M->>R: Tool request
R->>A: Evaluate risk
alt Approval required
  A->>H: Approval request
  H-->>A: Approve / Reject
  A-->>R: Decision
else Low risk
  A-->>R: Auto-approved
end
R->>D: Execute if allowed
D-->>R: Outcome
~~~

Approval must bind to the exact tool version and arguments. Approving one resource must not authorize a different resource.

## 10. Idempotency

Every side-effecting tool defines duplicate behavior before publication.

Examples:

- create external ticket -> idempotency key;
- send message -> canonical message/provider idempotency where supported;
- update setting -> version check;
- charge payment -> provider transaction/idempotency contract.

A provider timeout does not prove that a side effect failed.

## 11. Unknown External Outcome

~~~mermaid
flowchart TD
CALL[External Tool Call] --> TIMEOUT{Timeout}
TIMEOUT -->|No| KNOWN[Known Result]
TIMEOUT -->|Yes| RECON[Reconciliation]
RECON --> FOUND[Side Effect Found]
RECON --> NOTFOUND[No Side Effect]
FOUND --> KNOWN
NOTFOUND --> RETRY[Retry Only When Safe]
~~~

Blind retries are forbidden for unknown high-impact outcomes.

## 12. Credentials

The model sees a logical tool, never a raw provider credential.

~~~mermaid
flowchart LR
MODEL[Model] --> RUNTIME[Tool Runtime]
RUNTIME --> REF[Credential Reference]
REF --> SECRETS[Secret Manager]
SECRETS --> ADAPTER[Provider Adapter]
ADAPTER --> PROVIDER[External API]
~~~

Secrets never enter prompts, tool results, browser responses, normal events or logs.

## 13. Output Sanitization

Provider/internal data is projected into a bounded result.

Remove:

- secrets;
- unrelated customer records;
- stack traces;
- internal authorization metadata;
- uncontrolled payload size;
- fields unnecessary for the current task.

The model should receive the minimum useful result.

## 14. Cross-Domain Contracts

**AI:** agent policy decides which tools are available; runtime performs the final authorization.

**Workflows:** workflow steps invoke tools through a bounded service identity.

**Tenancy:** every target resource is resolved inside organization scope.

**Billing:** governed tools may consume entitlements and usage.

**Audit:** sensitive invocations are traceable.

## 15. Failure Taxonomy

| Failure | Behavior |
|---|---|
| invalid tool | block |
| invalid arguments | block before side effect |
| unauthorized | block |
| entitlement denied | block |
| approval rejected | do not execute |
| provider timeout | reconcile when side effect possible |
| provider rate limit | bounded retry |
| unknown result | reconciliation state |

## 16. Observability

Every invocation should expose:

- invocation ID;
- run ID;
- organization;
- tool/version;
- risk tier;
- authorization result;
- approval state;
- duration;
- retry count;
- provider;
- outcome;
- error class;
- idempotency key.

## 17. Acceptance Criteria

- No tool executes solely because the model requested it.
- Every published tool has schema, timeout, retry and side-effect semantics.
- Cross-tenant access is impossible through model input.
- High-risk actions can require approval.
- Side effects are idempotent or reconciled.
- Tool versions remain available for audit/replay.
- Credentials never reach model context.
