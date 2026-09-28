# Security Threat Model

> Status: **Target production security contract**

## 1. Security Objective

The security model protects:

- tenant data;
- customer PII;
- conversation history;
- provider/API credentials;
- AI policies and traces;
- business actions;
- subscription/payment state;
- audit history.

The most important property is that an untrusted input can never become a trusted authority.

## 2. Trust Boundaries

~~~mermaid
flowchart TB
    INTERNET[Internet / Customers / Providers] --> EDGE[Public Edge]
    EDGE --> API[API Boundary]
    API --> AUTH[Identity + Authorization]
    AUTH --> DOMAIN[Domain Services]
    DOMAIN --> DB[(PostgreSQL)]
    DOMAIN --> OUTBOX[Outbox]
    OUTBOX --> WORKER[Workers]
    WORKER --> EXTERNAL[External Providers]
    AI[Model Providers] --> WORKER
    SEARCH[Search / Vector] --> WORKER
    SECRET[Secret Manager] --> API
    SECRET --> WORKER
~~~

Each transition between trust zones performs validation appropriate to that boundary.

## 3. Assets and Attack Consequences

| Asset | Example impact |
|---|---|
| Customer data | privacy breach |
| Conversation data | customer confidentiality breach |
| Provider credentials | unauthorized external access |
| AI tools | fraudulent/unsafe business actions |
| Billing state | financial loss |
| Tenant membership | privilege escalation |
| Audit logs | loss of investigation evidence |
| Knowledge base | confidential information disclosure |

## 4. Threat Register

| Threat | Attack path | Primary control | Detection |
|---|---|---|---|
| cross-tenant access | valid UUID from another tenant | tenant-scoped queries | negative security tests |
| privilege escalation | manipulated role/scope | server-side authorization | audit anomalies |
| webhook spoofing | forged provider request | signature verification | verification metrics |
| replay attack | valid old webhook | provider timestamp/dedupe | duplicate metrics |
| prompt injection | malicious customer/document | trust separation | AI evaluation |
| tool abuse | model requests unsafe action | tool policy | invocation audit |
| credential leakage | logs/client payloads | secret boundary | secret scanning |
| duplicate financial effect | payment replay | idempotency | reconciliation |
| workflow explosion | unbounded fan-out | run/step limits | queue/cost metrics |
| supply-chain compromise | malicious dependency | lockfile/CI controls | dependency scanning |
| session theft | browser credential exposure | secure session controls | auth anomaly monitoring |

## 5. Prompt Injection Threat

The AI system assumes customer text, documents and tool outputs are hostile data.

~~~mermaid
flowchart LR
INPUT[Untrusted Content] --> MODEL[Model]
MODEL --> INTENT[Proposed Intent]
INTENT --> POLICY[Independent Policy]
POLICY -->|deny| BLOCK[Block]
POLICY -->|allow| EXEC[Controlled Execution]
~~~

The policy engine, not the model, decides authorization.

## 6. Data Exfiltration Threat

Context access is:

~~~text
requested data
  ∩ tenant scope
  ∩ resource authorization
  ∩ agent context policy
  ∩ data retention rules
~~~

A model cannot expand the intersection by asking for more data.

## 7. Abuse Controls

Protect against:

- login brute force;
- API scraping;
- webhook floods;
- expensive AI prompts;
- repeated tool retries;
- large knowledge uploads;
- workflow fan-out;
- export abuse.

Use layered rate limits, quotas, queues and operator controls.

## 8. Security Testing Model

Every critical threat gets:

1. preventive control;
2. automated negative test;
3. observable signal;
4. incident response path.

A control without detection is incomplete for high-impact threats.

## 9. Security Requirements

- TLS for external/intersystem transport where supported;
- no secrets in client bundles;
- tenant scope before resource lookup;
- least privilege;
- immutable security audit records;
- explicit privileged operations;
- safe retry/reconciliation;
- dependency and secret scanning in CI.

## 10. Threat Modeling Workflow

~~~mermaid
flowchart LR
CHANGE[Architecture / Feature Change] --> ASSET[Identify Assets]
ASSET --> TRUST[Map Trust Boundaries]
TRUST --> THREATS[Enumerate Threats]
THREATS --> CONTROLS[Select Controls]
CONTROLS --> TESTS[Negative Tests]
TESTS --> MONITOR[Detection]
MONITOR --> RESPONSE[Incident Response]
~~~

## 11. Acceptance Criteria

- Threats map to explicit controls.
- Cross-tenant access has automated negative tests.
- AI prompt injection cannot directly authorize actions.
- Webhooks are verified before mutation.
- Secrets are excluded from client/log/event surfaces.
- High-risk failures are observable and actionable.
