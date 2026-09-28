# Incident Response — Implementation Specification

> Status: **Target operational/security blueprint**

## 1. Severity

| Level | Meaning |
|---|---|
| SEV-1 | active breach, broad outage, major integrity/financial impact |
| SEV-2 | material degradation or contained serious security issue |
| SEV-3 | limited operational defect |

Severity can be escalated as evidence changes.

## 2. Lifecycle

~~~mermaid
flowchart LR
DETECT[Detect] --> TRIAGE[Triage]
TRIAGE --> CONTAIN[Contain]
CONTAIN --> ERADICATE[Eradicate]
ERADICATE --> RECOVER[Recover]
RECOVER --> VERIFY[Verify]
VERIFY --> REVIEW[Post-Incident Review]
~~~

## 3. Triage Record

Capture:

- first observed time;
- affected organizations;
- affected resource types;
- security impact;
- financial impact;
- availability impact;
- blast radius;
- known/unknown facts;
- current containment.

## 4. Containment

Possible actions:

- pause AI agent;
- disable tool;
- disable channel;
- revoke credential;
- pause workflow;
- disable feature;
- restrict endpoint;
- stop deployment.

Containment must preserve evidence.

## 5. Tenant-Isolation Incident

If data isolation is suspected:

1. identify affected organizations;
2. identify resources;
3. determine time window;
4. inspect authorization/audit evidence;
5. disable vulnerable path;
6. patch;
7. execute isolation regression suite;
8. verify closure;
9. execute required notification process according to applicable obligations.

## 6. AI Incident

Preserve:

~~~text
run_id
agent version
policy version
model route
knowledge snapshot
tool versions
guardrail decisions
control version
~~~

Then:

~~~text
pause affected capability
 -> reproduce
 -> classify root cause
 -> add regression test
 -> fix
 -> evaluate
 -> controlled reactivation
~~~

## 7. Financial Incident

For billing/payment mismatch:

- stop unsafe automation;
- preserve provider IDs;
- compare local/provider state;
- reconcile;
- correct through auditable operation;
- verify entitlements.

Never erase original financial facts.

## 8. Evidence

Preserve:

- request IDs;
- correlation IDs;
- audit records;
- event IDs;
- release SHA;
- configuration versions;
- relevant logs;
- provider references.

Minimize copied customer content.

## 9. Recovery Verification

Recovery requires:

~~~text
control restored
security checks pass
data checks pass
queues healthy
customer behavior verified
monitoring stable
~~~

## 10. Postmortem

Record:

- root cause;
- contributing factors;
- failed controls;
- detection gap;
- recovery gap;
- customer impact;
- corrective work;
- new tests;
- documentation changes.

## 11. Acceptance

Every high-impact incident class has detection, containment, evidence preservation, recovery and regression procedures.
