# Incident Response

> Status: **Target production operations/security contract**

Incident response is the operational system used when availability, confidentiality, integrity or financial correctness is threatened.

## 1. Severity

| Severity | Meaning | Example |
|---|---|---|
| SEV-1 | active breach, broad outage, major integrity impact | tenant data exposure |
| SEV-2 | material degradation or contained security issue | channel outage, credential compromise isolated to one integration |
| SEV-3 | limited defect or anomaly | non-critical job failure |

Severity can be escalated as evidence changes.

## 2. Incident Lifecycle

~~~mermaid
flowchart LR
DETECT[Detect] --> TRIAGE[Classify / Triage]
TRIAGE --> CONTAIN[Contain]
CONTAIN --> ERADICATE[Eradicate]
ERADICATE --> RECOVER[Recover]
RECOVER --> VERIFY[Verify]
VERIFY --> LEARN[Post-Incident Review]
~~~

## 3. Detection Sources

Incidents may originate from:

- monitoring alerts;
- security alerts;
- customer reports;
- provider alerts;
- QA findings;
- billing reconciliation;
- anomaly detection;
- audit review;
- engineer discovery.

## 4. Initial Triage

First establish:

- what failed;
- when it started;
- affected tenants;
- affected resources;
- security/privacy implications;
- financial implications;
- current blast radius;
- whether the incident is ongoing.

Do not speculate beyond evidence.

## 5. Containment

Possible containment actions:

- disable integration;
- pause AI automation;
- disable tool;
- revoke credential;
- restrict endpoint;
- pause workflow execution;
- suspend affected tenant operation;
- stop a deployment;
- block outbound automation.

Containment should minimize additional damage without destroying forensic evidence.

## 6. Security Incident Flow

~~~mermaid
sequenceDiagram
participant ALERT as Alert
participant IC as Incident Lead
participant SEC as Security
participant OPS as Operations
participant ENG as Engineering
ALERT->>IC: Incident opened
IC->>SEC: Security assessment
IC->>OPS: Containment action
OPS-->>IC: Contained
IC->>ENG: Root cause / remediation
ENG-->>IC: Fix deployed
IC->>OPS: Recovery verification
OPS-->>IC: Healthy
~~~

## 7. Evidence Preservation

Preserve as appropriate:

- request IDs;
- correlation IDs;
- audit events;
- deployment commit/tag;
- configuration versions;
- provider event IDs;
- relevant logs;
- database state;
- access records.

Avoid copying unnecessary customer content into incident documents.

## 8. Data Exposure

For suspected tenant data exposure:

1. identify affected organization(s);
2. identify affected resource classes;
3. determine time window;
4. determine whether data was accessed or only potentially exposed;
5. revoke attacker credentials;
6. patch authorization gap;
7. run cross-tenant regression suite;
8. review audit evidence;
9. execute required notification process according to applicable contractual/legal obligations.

## 9. Financial Incident

For billing/payment anomalies:

- stop unsafe automatic financial actions;
- preserve payment/provider identifiers;
- reconcile against provider;
- freeze affected automation;
- identify duplicated/missing effects;
- correct through auditable financial operations.

Never "fix" an accounting discrepancy by deleting the original event.

## 10. AI Incident

For AI safety incident:

- pause affected agent/tool/policy;
- preserve run IDs and policy versions;
- inspect prompts/context/tool traces;
- determine whether the issue was model, policy, retrieval, tool, or authorization;
- add regression case;
- validate fix before reactivation.

## 11. Recovery Verification

Recovery is complete only when:

- primary failure is fixed;
- security controls are active;
- queues are healthy;
- no hidden corrupted state remains;
- customer-visible behavior is verified;
- monitoring confirms stability.

## 12. Communication

Operational communication should state:

- known facts;
- affected scope;
- current mitigation;
- current uncertainty;
- next control action.

Avoid unsupported root-cause claims before investigation is complete.

## 13. Post-Incident Review

The review identifies:

- root cause;
- contributing conditions;
- failed control;
- detection gap;
- recovery gap;
- customer impact;
- corrective actions;
- documentation changes;
- testing changes.

Repeated incidents should trigger architecture review rather than repeated manual work.

## 14. Runbooks

Critical systems should have runbooks for:

- database outage;
- queue outage;
- Redis outage;
- provider outage;
- credential compromise;
- tenant-isolation violation;
- AI runaway loop;
- payment mismatch;
- backup restore.

## 15. Acceptance Criteria

- Severity can be assigned consistently.
- Containment actions are documented.
- Security incidents preserve evidence.
- Financial incidents use reconciliation.
- AI incidents preserve model/policy/tool traces.
- Recovery has explicit verification checks.
- Postmortem actions become tracked engineering work.
