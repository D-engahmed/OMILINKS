# Release Process

> Status: **Target production release contract**

A release is a controlled production change with known code, schema, configuration, monitoring and recovery strategy.

## 1. Release Record

Every release identifies:

- commit SHA;
- artifact version;
- migration version;
- configuration changes;
- feature flags;
- provider changes;
- known risks;
- mitigation/rollback plan.

## 2. Release Pipeline

~~~mermaid
flowchart TD
CHANGE[Change] --> LINT[Lint / Format]
LINT --> TYPE[Typecheck]
TYPE --> TEST[Unit + Integration + Contract]
TEST --> BUILD[Build Artifact]
BUILD --> MIGRATE[Migration Compatibility]
MIGRATE --> STAGE[Staging]
STAGE --> SMOKE[Smoke / Synthetic Tests]
SMOKE --> PROD[Production]
PROD --> MONITOR[Monitoring]
MONITOR -->|healthy| DONE[Complete]
MONITOR -->|unhealthy| MIT[Mitigate / Rollback / Forward Fix]
~~~

## 3. CI Gates

Minimum gates:

- dependency install from lockfile;
- lint;
- format verification;
- typecheck;
- tests;
- API/event contract checks;
- build.

## 4. Staging

Staging should validate:

- authentication;
- tenant creation/context;
- customer/conversation path;
- routing;
- workflow;
- AI test path;
- provider sandbox;
- payment sandbox;
- observability.

## 5. Migration Safety

Schema and application versions must remain compatible during rolling deployment.

Preferred:

~~~text
expand
 -> compatible code
 -> backfill
 -> switch
 -> contract later
~~~

## 6. Feature Rollout

High-risk features use:

- explicit tenant allowlist;
- feature flag;
- staged percentage rollout where appropriate;
- independent disablement.

This is especially important for AI autonomy and external channel sends.

## 7. Deployment Order

Typical compatible order:

1. deploy backward-compatible backend;
2. apply compatible migration;
3. deploy workers;
4. deploy web/widget;
5. enable feature;
6. monitor.

Actual order follows the specific compatibility contract.

## 8. Smoke Tests

After deployment:

- health;
- readiness;
- authentication;
- organization context;
- customer read/create;
- conversation read/create;
- message acceptance;
- worker processing;
- event processing;
- integration health;
- billing state.

## 9. Monitoring

Observe:

- error rate;
- p95/p99 latency;
- queue age;
- webhook lag;
- worker failures;
- provider failures;
- AI latency/cost;
- billing reconciliation;
- database saturation.

## 10. Rollback

Code rollback is safe only when schema compatibility remains valid.

Otherwise use:

- feature disablement;
- configuration rollback;
- forward fix;
- compatible hotfix.

## 11. Rollout Abort Conditions

Pause rollout on:

- tenant-isolation failure;
- critical authorization failure;
- unexpected error-rate increase;
- queue backlog growth;
- payment inconsistency;
- AI tool-safety regression;
- severe provider delivery failure.

## 12. Post-Release

Store:

- release outcome;
- smoke-test evidence;
- monitoring observations;
- incidents;
- mitigation/rollback;
- migration verification.

Recurring issues become tracked engineering work.

## 13. Acceptance Criteria

- Every deployment is traceable to a commit.
- CI gates are automated.
- Migration compatibility is verified.
- Staging smoke tests pass.
- Production smoke tests run.
- Monitoring is active before full rollout.
- High-risk features can be independently disabled.
- Recovery strategy considers schema state.
