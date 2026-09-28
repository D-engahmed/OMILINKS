# Security Threat Model — Implementation Specification

> Status: **Target security engineering blueprint**

## 1. Security Objectives

Protect:

- tenant isolation;
- customer PII;
- conversation confidentiality;
- credentials/secrets;
- AI context and tool authority;
- billing integrity;
- audit integrity;
- customer-operation availability.

## 2. Trust Boundaries

~~~mermaid
flowchart TB
EXT[Internet / Providers] --> EDGE[Public Edge]
EDGE --> API[API / Webhook]
API --> AUTH[Identity / Authorization]
AUTH --> DOMAIN[Domain Services]
DOMAIN --> DB[(PostgreSQL)]
DOMAIN --> OUTBOX[Outbox]
OUTBOX --> WORKERS[Workers]
WORKERS --> PROVIDERS[External Providers]
WORKERS --> AI[Model Providers]
AI --> SEARCH[Knowledge Search]
SECRETS[Secret Manager] --> API
SECRETS --> WORKERS
~~~

Every trust-boundary crossing validates the data required by that boundary.

## 3. Threat Register

| Threat | Primary control | Verification |
|---|---|---|
| cross-tenant read | scoped query + ownership check | negative test |
| cross-tenant write | scoped mutation | negative test |
| privilege escalation | role/scope evaluation | authorization suite |
| spoofed webhook | provider verification | forged callback |
| replay | dedupe/timestamp | replay test |
| prompt injection | trust separation + tool authorization | adversarial evaluation |
| tool abuse | allowlist/risk/authorization | tool suite |
| secret leakage | secret boundary + redaction | CI/runtime checks |
| payment replay | idempotency + reconciliation | billing suite |
| workflow explosion | budgets/fan-out limits | load test |
| dependency compromise | lockfile/scanning | CI |
| session theft | secure sessions/revocation | security tests |

## 4. Tenant Isolation Threat

Threat:

~~~text
attacker has a valid resource identifier from another tenant
~~~

Control:

~~~text
resource lookup requires organization context
+
ownership check
~~~

Expected:

~~~text
no protected data disclosed
no state mutation
security telemetry when appropriate
~~~

## 5. AI Security Boundary

~~~mermaid
flowchart LR
INPUT[Customer / Document] --> MODEL[Model]
MODEL --> PROPOSAL[Proposed Action]
PROPOSAL --> AUTHZ[Independent Authorization]
AUTHZ -->|deny| BLOCK[Block]
AUTHZ -->|allow| TOOL[Controlled Tool]
TOOL --> DOMAIN[Domain Service]
DOMAIN --> EFFECT[Business Effect]
~~~

A model is an untrusted action proposer.

## 6. Prompt Injection

Test:

- direct instruction injection;
- instruction inside knowledge documents;
- malicious tool output;
- system-like injected content;
- encoded/obfuscated instructions;
- multi-turn persistence;
- tenant-escape attempts.

## 7. Data Exfiltration

Eligible data is:

~~~text
candidate data
INTERSECT tenant
INTERSECT scope
INTERSECT permission
INTERSECT agent context policy
~~~

The model cannot expand this set.

## 8. Webhook Threats

Controls:

- provider authentication;
- replay protection;
- body limits;
- rate limiting;
- provider/account binding;
- durable dedupe.

## 9. Secret Threats

Never place secrets in:

- browser bundles;
- API responses;
- events;
- prompts;
- retrieval documents;
- logs;
- generic errors.

## 10. Abuse / DoS

Protect:

- login;
- search;
- exports;
- webhooks;
- AI;
- workflow fan-out;
- knowledge ingestion;
- bulk APIs.

Use layered rate limits, concurrency budgets, size limits and queues.

## 11. Security Logging

Capture:

~~~text
actor
organization
operation
target
result
correlation_id
timestamp
~~~

Do not capture raw secret material or unnecessary full customer payloads.

## 12. Detection Signals

- repeated cross-tenant attempts;
- unusual export volume;
- invalid webhook spikes;
- abnormal session failures;
- credential failures;
- AI tool blocks;
- sudden cost spikes.

## 13. Threat-Model Workflow

~~~mermaid
flowchart LR
CHANGE[Feature / Architecture Change] --> ASSET[Identify Assets]
ASSET --> TRUST[Map Trust Boundaries]
TRUST --> THREAT[Enumerate Threats]
THREAT --> CONTROL[Choose Controls]
CONTROL --> TEST[Automated Tests]
TEST --> MONITOR[Detection]
MONITOR --> RESPONSE[Incident Response]
~~~

## 14. Acceptance

Every high-impact threat must have:

~~~text
preventive control
+
automated negative test
+
detection signal
+
incident procedure
~~~
