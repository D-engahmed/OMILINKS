# Release Process — Implementation Specification

> Status: **Target production release contract**

## 1. Release Inputs

Record:

~~~text
commit SHA
artifact version/digest
migration version
configuration version
feature flags
provider changes
known risks
mitigation/rollback
~~~

## 2. Pipeline

~~~mermaid
flowchart TD
CHANGE[Change] --> LINT[Lint]
LINT --> TYPE[Typecheck]
TYPE --> TEST[Test]
TEST --> CONTRACT[API/Event Contract]
CONTRACT --> BUILD[Build]
BUILD --> MIGRATE[Migration Verification]
MIGRATE --> STAGE[Staging Deploy]
STAGE --> SMOKE[Smoke Tests]
SMOKE --> PROD[Production]
PROD --> MONITOR[Monitor]
MONITOR -->|healthy| DONE[Complete]
MONITOR -->|unhealthy| MIT[Mitigate / Rollback / Forward Fix]
~~~

## 3. CI Minimum Gates

- install from lockfile;
- lint;
- format;
- typecheck;
- tests;
- API contract validation;
- event schema validation;
- build.

## 4. Staging

Exercise:

- auth;
- tenant creation;
- customer/conversation;
- routing;
- workflow;
- AI sandbox;
- channel sandbox;
- payment sandbox;
- observability.

## 5. Migration Gate

Validate:

~~~text
old application
+
new schema
+
new application
~~~

during the compatibility window.

## 6. Feature Rollout

Risky features use independent controls:

- tenant allowlist;
- feature flag;
- staged rollout;
- kill switch.

Critical examples:

- autonomous AI;
- external message send changes;
- new routing engine;
- billing enforcement.

## 7. Smoke Tests

Post-deploy:

- health;
- readiness;
- authentication;
- tenant context;
- customer read/create;
- conversation read/create;
- message acceptance;
- worker;
- event processing;
- integration health;
- billing read.

## 8. Monitoring Gates

Watch:

- error rate;
- p95/p99 latency;
- queue age;
- worker failures;
- webhook lag;
- provider failures;
- AI cost;
- database saturation;
- billing mismatch.

## 9. Rollback

Use code rollback only when schema is compatible.

Otherwise:

~~~text
disable feature
 -> reduce traffic
 -> forward fix
 -> reconcile
~~~

## 10. Abort Conditions

Pause rollout on:

- tenant-isolation failure;
- authorization regression;
- critical queue growth;
- payment inconsistency;
- AI tool-safety regression;
- widespread provider delivery failure.

## 11. Post-Release Evidence

Store:

- smoke result;
- deployment SHA;
- migration status;
- feature state;
- monitoring summary;
- incidents;
- mitigation if used.

## 12. Acceptance

A release is complete only when the deployed artifact, database state, feature state and operational health are traceable.
