# n8n Integration

> Status: **Target production integration contract**

n8n is an external automation system used to connect OMILINKS with other services. OMILINKS remains authoritative for customer, conversation, authorization, AI policy, workforce and billing state.

## 1. Integration Modes

### Outbound trigger

OMILINKS sends an authenticated event to an n8n workflow.

### Inbound action

An n8n workflow calls a scoped OMILINKS API operation.

### Callback

n8n returns the execution outcome using a correlation identifier.

## 2. Boundary

OMILINKS owns:

- customers;
- customer identities;
- conversations;
- assignments;
- AI policies;
- workflow state;
- entitlements;
- payments.

n8n owns external automation execution state.

## 3. Architecture

~~~mermaid
sequenceDiagram
    participant O as OMILINKS
    participant N as n8n
    participant X as External System
    participant C as Callback
    O->>N: Signed event
    N->>X: External automation
    X-->>N: Result
    N->>C: Authenticated callback
    C->>O: Correlated outcome
    O->>O: Update workflow state
~~~

## 4. Authentication

Outbound events use a signed request or other explicit authentication mechanism.

Inbound n8n operations use a scoped service principal/API credential.

Do not provide a general OMILINKS administrator credential to n8n.

## 5. Tenant Scope

Every connection is bound to an organization and optional subordinate scope.

An n8n request cannot switch organization through a customer-supplied organization ID.

Resource ownership is resolved server-side.

## 6. Idempotency

Every n8n-triggered mutation uses an idempotency key based on:

~~~text
n8n execution/correlation
+ semantic operation
~~~

Duplicate workflow retries must not duplicate customer-facing or financial side effects.

## 7. Long-Running Automation

Do not hold an HTTP request open while n8n runs.

OMILINKS stores a waiting state:

~~~text
workflow step
 -> WAITING_EXTERNAL
 -> callback
 -> RESUME
~~~

A timeout becomes an explicit workflow failure/escalation state.

## 8. Workflow Interaction

n8n can perform external work while OMILINKS controls the business boundary.

Example:

~~~text
OMILINKS workflow
 -> n8n CRM sync
 -> CRM operation
 -> n8n callback
 -> OMILINKS records sync result
~~~

If n8n is unavailable, OMILINKS retains the workflow state and retries according to policy.

## 9. Failure Modes

| Failure | Behavior |
|---|---|
| invalid credential | reject |
| n8n unavailable | queue/retry |
| duplicate action | idempotent |
| delayed callback | remain waiting until timeout |
| callback duplicate | idempotent |
| external workflow error | step failure with reason |
| callback never arrives | timeout + escalation |
| unauthorized tenant resource | deny |

## 10. Security

- scoped service identities;
- authenticated inbound calls;
- signed outbound events;
- no unrestricted internal APIs;
- credentials referenced through secrets infrastructure;
- all n8n-triggered mutations audited.

## 11. Observability

Track:

- n8n execution ID;
- OMILINKS correlation ID;
- request latency;
- callback latency;
- retry count;
- waiting duration;
- timeout count;
- external workflow error;
- tenant.

## 12. Testing

- trigger success;
- invalid credentials;
- duplicate action;
- callback success;
- duplicate callback;
- delayed callback;
- n8n outage;
- timeout;
- cross-tenant action;
- workflow recovery.

## 13. Acceptance Criteria

- n8n cannot bypass OMILINKS authorization.
- Long-running external automation is durable.
- Duplicate execution is safe.
- Callback outcomes are correlated and auditable.
- Provider failure does not corrupt workflow state.
- OMILINKS remains source of truth.
