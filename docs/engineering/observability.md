# Observability Architecture

> Status: **Target production observability contract**

## 1. Three Pillars

OMILINKS observes:

~~~text
logs
metrics
traces
~~~

Audit records are a separate business/security history.

## 2. Trace Model

~~~mermaid
sequenceDiagram
participant C as Client
participant API as API
participant DB as PostgreSQL
participant O as Outbox
participant W as Worker
participant AI as AI Runtime
participant P as Provider
C->>API: Request ID R
API->>DB: Transaction
API->>O: Event
O->>W: Job
W->>AI: Run
AI->>P: Provider call
P-->>AI: Result
AI-->>W: Outcome
W-->>API: Domain effect
~~~

Correlation must be propagated across every boundary.

## 3. Required Identifiers

At minimum:

~~~text
request_id
correlation_id
causation_id
organization_id
user/service principal
run_id
workflow_run_id
tool_invocation_id
provider_event_id
~~~

## 4. Metrics

### API

- request rate;
- p50/p95/p99 latency;
- error rate;
- rate-limit rate.

### Queue

- depth;
- oldest age;
- retry rate;
- dead-letter count.

### AI

- run rate;
- first-token latency;
- total latency;
- token usage;
- cost;
- fallback rate;
- handoff/block rate.

### Integrations

- webhook rate;
- verification failure;
- provider latency;
- 429/5xx;
- delivery success;
- unknown outcome rate.

### Billing

- payment success;
- webhook lag;
- reconciliation mismatches;
- entitlement denials.

## 5. Structured Logs

Log records should contain:

~~~text
timestamp
level
service
operation
request_id
correlation_id
organization_id when safe
outcome
duration
error_class
~~~

Do not log raw credentials or unnecessary customer content.

## 6. SLO Signals

SLOs should be based on user-visible outcomes:

~~~text
API availability
message acceptance latency
message delivery success
queue freshness
AI completion/handoff latency
billing reconciliation freshness
~~~

## 7. Alerts

Alerts should be actionable.

Examples:

- tenant isolation violation;
- queue age above threshold;
- provider failure spike;
- payment reconciliation backlog;
- AI cost anomaly;
- dead-letter growth;
- backup/restore failure.

## 8. Acceptance

A production-critical operation must be traceable and measurable without requiring raw customer payload logging.
