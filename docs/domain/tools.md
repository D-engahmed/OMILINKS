# Tools Domain — Implementation Specification

> Status: **Target implementation blueprint**

## 1. Tool as a Capability

A tool is a named, versioned capability with a schema, risk contract and execution adapter.

~~~text
ToolDefinition
 -> ToolVersion
 -> ToolPolicy
 -> Tool Runtime
 -> Domain Service / Provider Adapter
~~~

The model requests capabilities; it never receives raw infrastructure access.

## 2. Data Model

~~~mermaid
erDiagram
    ORGANIZATION ||--o{ TOOL_POLICY : owns
    TOOL_DEFINITION ||--o{ TOOL_VERSION : versions
    TOOL_VERSION ||--o{ TOOL_INVOCATION : executes
    TOOL_POLICY ||--o{ TOOL_BINDING : permits
    TOOL_INVOCATION ||--o| APPROVAL : may_require
    TOOL_INVOCATION ||--o| CREDENTIAL_REF : uses
~~~

## 3. Tool Definition

Minimum fields:

~~~text
tool_id
name
description
risk_tier
status
owner
created_at
updated_at
~~~

ToolDefinition is the stable identity. ToolVersion contains executable semantics.

## 4. Tool Version

Version contains:

- input schema;
- output schema;
- side-effect class;
- timeout;
- retry policy;
- idempotency strategy;
- adapter version;
- capability metadata.

A breaking schema change creates a new version.

## 5. Publication Lifecycle

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

Publishing validates all dependencies and policy references.

## 6. Invocation Pipeline

~~~mermaid
sequenceDiagram
participant M as Model
participant R as Tool Runtime
participant Z as Authorization
participant E as Entitlement
participant A as Approval
participant D as Domain / Adapter
M->>R: Tool intent
R->>Z: Permission + tenant + resource
Z-->>R: Allowed
R->>E: Entitlement
E-->>R: Allowed
R->>A: Risk decision
A-->>R: Approved / not required
R->>D: Execute
D-->>R: Result
R-->>M: Sanitized result
~~~

## 7. Invocation Record

Store:

~~~text
invocation_id
run_id
organization_id
tool_id
tool_version
input_hash
idempotency_key
authorization_decision
approval_state
started_at
completed_at
outcome
error_class
external_reference
~~~

Raw arguments may require stronger retention/privacy controls.

## 8. Authorization

Effective permission is evaluated from:

~~~text
platform controls
+ tenant policy
+ agent/tool policy
+ principal permissions
+ resource ownership
+ resource state
+ entitlement
~~~

Every invocation performs the checks again.

## 9. Resource Access

A tool receives an organization context from the runtime.

The handler must not allow:

~~~text
requested organization
!=
execution organization
~~~ 

unless there is an explicitly modeled cross-tenant administrative operation, which should be rare and separately permissioned.

## 10. Side-Effect Classification

| Class | Example | Required control |
|---|---|---|
| read | lookup customer | authorization |
| internal write | update customer | transaction + idempotency |
| external write | send message | provider idempotency/reconciliation |
| destructive | delete/close | approval/strict policy |

## 11. Idempotency

For side effects, define a semantic key.

~~~text
organization
+ tool version
+ run
+ semantic request key
~~~

The runtime checks existing invocation state before another effect is attempted.

## 12. Unknown Outcome

~~~mermaid
flowchart TD
CALL[External Side Effect] --> RESULT{Known Result?}
RESULT -->|yes| DONE[Persist Result]
RESULT -->|no| UNKNOWN[UNKNOWN]
UNKNOWN --> RECON[Reconcile]
RECON --> EXISTS[Effect Exists]
RECON --> ABSENT[Effect Absent]
EXISTS --> DONE
ABSENT --> RETRY[Retry if Safe]
~~~

UNKNOWN is different from failure.

## 13. Approval Binding

Approval binds to:

- organization;
- tool ID/version;
- normalized action hash;
- target resource;
- requester/run;
- expiration;
- approver scope.

Changing a material input invalidates the approval.

## 14. Credential Isolation

The tool handler resolves a credential reference inside the adapter.

The model never sees the credential.

Credential access should also be separated by provider/account to prevent accidental cross-connection use.

## 15. Output Projection

Tool outputs are normalized before returning to the model.

Remove:

- secrets;
- unrelated records;
- stack traces;
- infrastructure URLs;
- internal permission state;
- excessive payloads.

## 16. Transactions

Internal business mutation:

~~~text
authorize
 -> domain command
 -> transaction
 -> outbox
 -> commit
~~~

External mutation:

~~~text
create invocation identity
 -> provider call
 -> reconcile if unknown
 -> canonical result
 -> event
~~~

## 17. Retry Classes

| Error | Retry |
|---|---|
| local validation | no |
| authorization denial | no |
| entitlement denial | no |
| provider 429 | bounded |
| provider 5xx | bounded |
| provider timeout on read | bounded |
| provider timeout on write | reconcile |
| business conflict | re-read/re-evaluate |
| unknown outcome | reconcile |

## 18. Test Vectors

- malformed schema;
- unknown tool;
- disabled tool;
- unauthorized user;
- cross-tenant resource;
- invalid scope;
- duplicate invocation;
- approval mismatch;
- provider timeout;
- unknown external outcome;
- credential isolation;
- stale AI control version.

## 19. Observability

Track invocation count, latency, retries, approval latency, authorization blocks, provider errors, unknown outcomes and tool-level cost.

## 20. Acceptance

A tool is production-ready only when its schema, authorization, idempotency, side-effect classification, failure behavior and audit trace are complete.
