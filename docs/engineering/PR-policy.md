# Pull Request Policy

> Status: **Target production engineering contract**

A pull request reviews a change in system behavior, not only syntax.

## 1. Required PR Content

Non-trivial PRs should describe:

- problem;
- intended behavior;
- affected domains;
- API/event changes;
- migration impact;
- security impact;
- tests;
- observability;
- rollout;
- rollback or mitigation.

## 2. Review Pipeline

~~~mermaid
flowchart TD
PR[Pull Request] --> CI[Automated Checks]
PR --> CODE[Code Review]
PR --> SECURITY[Security Review]
PR --> ARCH[Architecture Review When Needed]
CI --> GATE{All Required Gates?}
CODE --> GATE
SECURITY --> GATE
ARCH --> GATE
GATE -->|yes| MERGE[Merge]
GATE -->|no| CHANGE[Revision]
CHANGE --> CI
~~~

Security/architecture reviews can be conditional on the change risk.

## 3. Reviewer Questions

### Correctness

- Does implementation satisfy the requirement?
- Are state transitions valid?
- Are failures represented honestly?

### Tenant Security

- Is organization scope explicit?
- Can another tenant's ID be accessed?
- Are exports/search/jobs isolated?

### Authorization

- Can request input elevate permissions?
- Are role and resource scope checked?
- Does AI have narrower tool policy?

### Concurrency

- What happens under duplicate requests?
- Can two workers perform the same effect?
- Is versioning/locking required?

### Contracts

- Does OpenAPI change?
- Does an event schema change?
- Is compatibility preserved?

### Operations

- How is failure observed?
- Can the operation be retried/replayed?
- What happens during provider outage?

## 4. Test Requirements

Changed behavior needs tests.

Security-sensitive changes need negative tests.

Side-effecting integrations need duplicate/timeout tests.

## 5. Block Conditions

Block merge when:

- tenant scope is missing;
- authorization is implicit;
- side effects lack idempotency/reconciliation;
- migrations are unsafe;
- API/event contracts are undocumented;
- critical failures are swallowed;
- secrets are exposed;
- required tests are absent.

## 6. Review Comment Standard

A useful comment identifies:

~~~text
failure mode
impact
expected invariant/control
~~~

Avoid comments that tooling can enforce automatically.

## 7. Merge Gate

Before merge:

- required CI passes;
- required approvals exist;
- required review threads are resolved;
- migration/rollout impact is understood;
- docs are updated.

## 8. Acceptance Criteria

- PR review covers correctness and failure modes.
- Security boundaries are explicitly checked.
- Tests prove changed invariants.
- API/event changes are documented.
- Merge gates are automated when practical.
