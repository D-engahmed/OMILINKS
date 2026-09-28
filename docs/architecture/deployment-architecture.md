# Deployment Architecture

> Status: **Target production deployment architecture**

## 1. Environments

Minimum environments:

- development;
- staging;
- production.

Each has separate credentials, data and provider configurations.

## 2. Production Topology

~~~mermaid
flowchart TB
DNS[DNS / TLS] --> EDGE[Load Balancer / CDN]
EDGE --> WEB[Operations Web]
EDGE --> WIDGET[Widget]
EDGE --> API[API Replicas]

API --> DB[(Managed PostgreSQL)]
API --> CACHE[(Redis / Queue)]
API --> STORE[(Object Storage)]
API --> BUS[Event / Job Bus]

BUS --> WORK[Worker Pool]
WORK --> AI[AI Workers]
WORK --> WF[Workflow Workers]
WORK --> INT[Integration Workers]

AI --> MODELS[Model Providers]
INT --> CHANNELS[Channel Providers]
INT --> PAY[Payment Provider]
INT --> N8N[Automation Provider]

API --> OBS[Observability]
WORK --> OBS
~~~

## 3. Stateless Compute

Web/API/worker processes should be stateless.

Persistent state belongs in:

- PostgreSQL;
- object storage;
- queue/event infrastructure;
- managed search/vector storage.

## 4. Scaling

Scale independently:

~~~text
API:
  request concurrency / latency

workers:
  queue depth / oldest event

AI workers:
  AI concurrency / provider limits

workflow workers:
  scheduled job backlog

integration workers:
  provider rate limits
~~~

## 5. Deployment Artifact

A production release identifies:

~~~text
git commit SHA
artifact digest/version
schema/migration version
configuration version
feature flag state
~~~

## 6. Startup Checks

API/worker startup validates required configuration.

Readiness should fail if critical dependencies cannot support normal operation.

Liveness should not require every external provider to be healthy.

## 7. Database Migration

Migration deployment follows compatibility-first patterns.

During rolling deploy:

~~~text
old code
+
new code
+
compatible schema
~~~

must coexist.

## 8. Worker Deployment

Workers must understand queued event versions during rolling deployment.

Do not publish a new event schema before consumers can process it unless the compatibility strategy explicitly supports that sequence.

## 9. Feature Flags

Use feature/config gates for:

- AI autonomous mode;
- new channel;
- new workflow engine behavior;
- new billing enforcement;
- risky provider changes.

Flags are safety controls, not authorization.

## 10. Disaster Recovery

Recovery sequence:

1. recover database;
2. verify schema;
3. restore object references;
4. recover queue/event processing;
5. reconcile providers/payment;
6. verify tenant isolation;
7. resume traffic.

## 11. Production Security

- databases private;
- secrets injected at runtime;
- least-privilege service identities;
- network egress controlled;
- audit access to privileged infrastructure;
- encrypted storage/backups.

## 12. Observability

Track per deployment:

- API error rate;
- deployment health;
- queue age;
- worker crashes;
- database saturation;
- provider failures;
- AI cost;
- billing reconciliation.

## 13. Acceptance Criteria

- Environments are isolated.
- Stateful services are managed and backed up.
- Compute scales horizontally.
- Deployment metadata is traceable.
- Migrations are compatibility-safe.
- Feature disablement exists for high-risk changes.
- Recovery includes provider reconciliation.
