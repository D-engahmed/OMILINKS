# Pull Request Policy — Implementation Specification

> Status: **Target review contract**

## 1. Required PR Information

Non-trivial PRs include:

- problem;
- design;
- affected domains;
- APIs/events;
- data/migration;
- security;
- concurrency;
- tests;
- observability;
- rollout;
- rollback/mitigation.

## 2. Review Pipeline

~~~mermaid
flowchart TD
PR[PR] --> CI[Automated Gates]
PR --> CODE[Code Review]
PR --> SEC[Security Review if Risky]
PR --> ARCH[Architecture Review if Cross-cutting]
CI --> GATE{Ready?}
CODE --> GATE
SEC --> GATE
ARCH --> GATE
GATE -->|yes| MERGE[Merge]
GATE -->|no| REVISE[Revision]
REVISE --> CI
~~~

## 3. Reviewer Checklist

Correctness:

- valid state transitions;
- business invariants;
- edge cases;
- error behavior.

Tenant security:

- organization scope;
- cross-tenant IDs;
- search/export/job isolation.

Concurrency:

- duplicate request;
- simultaneous worker;
- stale version;
- provider timeout.

Contract:

- API changed?
- event schema changed?
- compatibility preserved?

Operations:

- metrics;
- logs;
- replay/recovery;
- provider failure.

## 4. Blocking Conditions

Block when:

- authorization is implicit;
- tenant scope is missing;
- side effect lacks idempotency/reconciliation;
- migration is unsafe;
- API/event contract undocumented;
- failure swallowed;
- secret exposed;
- critical test missing.

## 5. Required Tests

Tests correspond to changed invariants.

A UI-only change may need component/accessibility tests.

A permission change needs negative authorization tests.

A provider change needs timeout/rate-limit/duplicate tests.

## 6. Merge Gates

Required:

- CI pass;
- approvals;
- resolved blocking comments;
- migration reviewed;
- documentation updated.

## 7. Acceptance

PR review is complete only when correctness, security, contract compatibility and operational behavior have evidence.
