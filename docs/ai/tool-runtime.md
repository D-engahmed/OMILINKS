## AI Tool Runtime

> **Status:** Target production architecture

The Tool Runtime is the action boundary between AI and OMILINKS business systems.

The model produces a **request**. The runtime determines whether the action can execute.

## 1. Non-Negotiable Boundary

```text
MODEL OUTPUT
    !=
AUTHORIZATION
```

An AI-generated tool request is never evidence of permission.

## 2. Tool Lifecycle

```mermaid
flowchart TD
    INTENT[Model Tool Intent] --> REG[Tool Registry]
    REG --> VERSION[Resolve Tool Version]
    VERSION --> SCHEMA[Validate Arguments]
    SCHEMA --> SCOPE[Tenant + Resource Scope]
    SCOPE --> AUTHZ[Permission Policy]
    AUTHZ --> ENT[Entitlement]
    ENT --> APPROVAL{Approval Required?}
    APPROVAL -->|Yes| WAIT[Durable Approval]
    WAIT --> IDEM[Idempotency Check]
    APPROVAL -->|No| IDEM
    IDEM --> EXEC[Execute]
    EXEC --> TIMEOUT{Timed Out?}
    TIMEOUT -->|No| SAN[Sanitize]
    TIMEOUT -->|Yes| UNKNOWN[Unknown Outcome / Reconcile]
    UNKNOWN --> SAN
    SAN --> AUDIT[Persist Invocation]
    AUDIT --> RETURN[Bounded Tool Result]
```

## 3. Tool Definition Contract

Every tool has:

| Property | Purpose |
|---|---|
| tool_id | stable identifier |
| version | immutable executable contract |
| name | model-visible name |
| description | usage semantics |
| input_schema | runtime validation |
| output_schema | result contract |
| risk_tier | autonomy level |
| side_effect | none/read/write/external |
| timeout_ms | execution deadline |
| retry_policy | retry semantics |
| required_permissions | security requirements |
| required_entitlement | billing gate |
| adapter | implementation boundary |

## 4. Tool Versioning

Breaking changes create a new version.

```text
customer.lookup v1
customer.lookup v2
```

Historical AI runs retain the exact version used.

Never silently replace a schema that historical runs depend on.

## 5. Authorization Sequence

Authorization evaluates all restrictions:

```mermaid
sequenceDiagram
    participant M as Model
    participant R as Runtime
    participant Z as Authorization
    participant E as Entitlement
    participant D as Domain Service
    participant P as Provider
    M->>R: Tool request
    R->>Z: Principal + tenant + resource
    Z-->>R: Allowed / Denied
    R->>E: Check entitlement
    E-->>R: Allowed / Denied
    R->>D: Execute business operation
    D-->>R: Result
    R->>P: External call when required
    P-->>R: Provider result
    R-->>M: Sanitized result
```

A frontend "AI is enabled" flag has no security meaning.

## 6. Tenant Resource Protection

A tool request such as:

```json
{"tool":"customer.lookup","customer_id":"cust_123"}
```

must resolve:

```text
cust_123 -> organization X
requesting run -> organization Y
X != Y
=> DENY
```

Do not trust an organization ID supplied by the model or customer.

## 7. Credential Boundary

The model gets a logical tool name, never a raw provider credential.

```mermaid
flowchart LR
    MODEL[Model] --> TOOL[Tool Runtime]
    TOOL --> CREDREF[Credential Reference]
    CREDREF --> SECRETS[Secret Manager]
    SECRETS --> ADAPTER[Provider Adapter]
    ADAPTER --> PROVIDER[External API]
```

Secrets are never written to prompts, tool results, events, logs, or browser payloads.

## 8. Idempotency

Every side-effecting tool must define duplicate behavior.

Example:

```mermaid
sequenceDiagram
    participant M as Model
    participant R as Runtime
    participant DB as PostgreSQL
    participant D as Domain
    M->>R: create_ticket(key=K)
    R->>DB: Lookup invocation K
    alt Already completed
        DB-->>R: Existing result
        R-->>M: Existing result
    else First attempt
        R->>D: Create ticket
        D->>DB: Transaction
        DB-->>D: Created
        D-->>R: Result
        R->>DB: Store key K + result
        R-->>M: Created result
    end
```

A provider timeout is not proof that a side effect did not occur.

## 9. Approval

High-risk operations may require human approval.

```mermaid
stateDiagram-v2
    [*] --> REQUESTED
    REQUESTED --> APPROVED
    REQUESTED --> REJECTED
    REQUESTED --> EXPIRED
    APPROVED --> EXECUTING
    EXECUTING --> SUCCEEDED
    EXECUTING --> FAILED
```

Approval is bound to the exact tool version, arguments, tenant, resource and requester.

## 10. Timeouts and Cancellation

Every tool has a deadline.

Cancellation sources:

- human takeover;
- conversation closure;
- workflow cancellation;
- run deadline;
- platform shutdown.

The runtime must distinguish cancellation from unknown external outcome.

## 11. Output Sanitization

Provider/internal results are projected into a model-safe result.

Remove:

- credentials;
- irrelevant tenant data;
- stack traces;
- internal IDs not needed for reasoning;
- huge payloads;
- private fields not required by the task.

## 12. Failure Taxonomy

- VALIDATION_FAILED
- FORBIDDEN
- ENTITLEMENT_DENIED
- PROVIDER_TIMEOUT
- PROVIDER_REJECTED
- BUSINESS_CONFLICT
- UNKNOWN_OUTCOME
- INTERNAL_ERROR

Only known-safe failure classes should be automatically retried.

## 13. Observability

Persist:

- invocation ID;
- run ID;
- organization;
- tool/version;
- risk tier;
- authorization decision;
- approval;
- duration;
- retry count;
- provider;
- outcome;
- error class;
- idempotency key.

## 14. Acceptance Criteria

- No model output can directly execute an arbitrary capability.
- Cross-tenant tool access is denied.
- Tool schemas are versioned and validated.
- Raw credentials never reach model context.
- Side effects are idempotent or reconciled.
- High-risk actions support approval.
- Unknown outcomes do not trigger blind retries.
