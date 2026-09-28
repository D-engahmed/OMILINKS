# Non-Functional Requirements — Engineering Specification

> Status: **Target measurable NFR baseline**

## Performance

### NFR-PERF-001 API Latency

Target p95 < 300 ms for normal authenticated transactional API operations excluding asynchronous/AI/provider execution.

Measure at API edge and application service.

### NFR-PERF-002 Webhook Acknowledgement

Target p95 < 2 seconds after durable event acceptance.

Webhook handlers must not wait for AI/workflow completion.

### NFR-PERF-003 Routing

Target p95 < 150 ms for warm deterministic routing.

## Availability

### NFR-AVL-001 Core API

Target 99.9% monthly availability.

### NFR-AVL-002 Failure Isolation

Provider-specific failures shall not take unrelated channels/core reads offline.

## Scalability

### NFR-SCL-001 Horizontal Compute

API and worker pools shall scale independently.

### NFR-SCL-002 Queue Backpressure

Workers shall enforce bounded concurrency and expose queue age.

### NFR-SCL-003 Tenant Fairness

One tenant's workload shall not consume unlimited shared concurrency.

## Consistency

### NFR-CON-001 Strong Security Consistency

Tenant ownership, authorization and protected writes require strong consistency.

### NFR-CON-002 Eventual Derived State

Search/vector/analytics projections may be eventual and must expose freshness metadata when relevant.

### NFR-CON-003 Billing Consistency

Billing state is strongly maintained locally and reconciled against provider truth.

## Durability

### NFR-DUR-001 Durable Business State

Messages, assignments, workflow state, payment state, usage and audit records survive process restart.

### NFR-DUR-002 Durable Async Work

Queued work shall be recoverable after worker failure.

## Security

### NFR-SEC-001 Least Privilege

Services, users, tools and credentials receive minimum required authority.

### NFR-SEC-002 Tenant Isolation

Cross-tenant reads/writes/search/export/tool access must fail.

### NFR-SEC-003 Secret Isolation

Raw secrets shall not enter browser, model, event or generic log surfaces.

## Privacy

### NFR-PRI-001 Data Minimization

Only data necessary for the operation is copied into logs/traces/AI context.

### NFR-PRI-002 Retention Enforcement

Retention applies to canonical and derived data.

## Observability

### NFR-OBS-001 Traceability

Critical operations carry request/correlation identifiers.

### NFR-OBS-002 Failure Metrics

Queues, workers, providers, AI, billing and security controls expose actionable metrics.

## Reliability

### NFR-REL-001 Idempotency

Retry-sensitive external/system operations have deterministic duplicate behavior.

### NFR-REL-002 Unknown Outcomes

External write timeouts enter reconciliation rather than blind retry.

### NFR-REL-003 Runaway Protection

AI/workflow concurrency, steps, fan-out and cost are bounded.

## Maintainability

### NFR-MNT-001 Boundary Enforcement

Domain code does not depend on provider SDKs or transport details.

### NFR-MNT-002 Versioned Contracts

Breaking API/event/tool/AI policy changes require explicit versioning.

## Accessibility / UX

### NFR-UX-001 Accessibility

Critical operations target WCAG 2.2 AA practices.

### NFR-UX-002 RTL

Core application components support Arabic/RTL without duplicate implementations.

## Recovery

### NFR-DR-001 Recovery Objectives

Production defines RPO/RTO per critical data/service class.

### NFR-DR-002 Restore Verification

Restore drills verify tenant isolation, application correctness and provider reconciliation.

## Verification Rule

Every NFR has:

~~~text
metric
target
measurement point
alert threshold
test/evidence method
~~~
