# Non-Functional Requirements

> Status: **Target production engineering contract**

## 1. Performance

Initial engineering targets:

| Operation | Target |
|---|---|
| authenticated API | p95 < 300 ms excluding long jobs/AI |
| routing | p95 < 150 ms warm path |
| webhook acknowledgement | target < 2 s after durable acceptance |
| readiness | < 1 s |
| AI first token | target p95 < 4 s excluding unusual provider conditions |

Targets are measured in production-like environments and revised using observed data.

## 2. Availability

Core API target: 99.9% monthly availability.

Channel providers are independent failure domains.

A provider outage must not make unrelated customer operations unavailable.

## 3. Scalability

The system should scale horizontally for:

- API requests;
- websocket/realtime connections if introduced;
- background jobs;
- AI runs;
- webhook processing;
- workflow workers.

PostgreSQL remains the transactional authority.

## 4. Consistency

| Data | Consistency |
|---|---|
| tenant authorization | strong |
| customer/conversation state | strong |
| billing state | strong + reconciled |
| events | at-least-once |
| search indexes | eventual |
| analytics projections | eventual |
| AI evaluation projections | eventual |

## 5. Durability

Business records must survive normal process failure.

Durable state includes:

- messages;
- assignments;
- workflow state;
- AI run state;
- payments;
- usage;
- audit records;
- outbox events.

## 6. Security

Minimum controls:

- TLS externally;
- secret isolation;
- tenant-scoped queries;
- least privilege;
- immutable security/audit records;
- credential rotation;
- authorization negative tests;
- dependency/security scanning.

## 7. Privacy

Customer and AI data is minimized.

Sensitive categories have retention classes.

Logs must not become a second ungoverned customer database.

## 8. Observability

Use:

- structured logs;
- metrics;
- traces;
- audit events;
- correlation IDs;
- provider event IDs;
- AI run IDs;
- workflow run IDs.

The platform should support:

~~~text
customer message
 -> request ID
 -> conversation event
 -> routing decision
 -> AI run
 -> tool invocation
 -> provider delivery
~~~

as one traceable causal chain.

## 9. Recovery

Production must define RPO/RTO and prove them through restore drills.

Recovery includes provider/payment reconciliation.

## 10. Maintainability

Boundaries:

~~~text
transport
 -> application
 -> domain
 -> persistence
 -> integration
~~~

Provider SDKs are isolated.

Shared packages should contain stable abstractions rather than random utility code.

## 11. Testability

All critical domain invariants must be testable without depending on real providers.

Provider compatibility is verified separately through sandbox/integration tests.

## 12. Accessibility

Operations UI targets WCAG 2.2 AA practices.

Critical states must not depend on color alone.

## 13. Internationalization

The initial product should support Arabic and English-oriented content safely.

The architecture should avoid assumptions that:

- text is ASCII;
- names are one language;
- direction is always LTR;
- phone numbers have one formatting;
- provider content is English.

## 14. Operational Limits

Bound:

- request body size;
- pagination;
- queue retries;
- AI steps;
- AI tool calls;
- workflow fan-out;
- export size;
- document ingestion size;
- provider concurrency.

Unbounded systems eventually become reliability incidents.

## 15. Failure Isolation

~~~mermaid
flowchart TB
CHANNEL[Channel Failure] --> CHANNEL_ONLY[Channel Degraded]
MODEL[Model Failure] --> MODEL_ONLY[AI Degraded]
QUEUE[Queue Failure] --> QUEUE_ONLY[Async Degraded]
PAYMENT[Payment Failure] --> BILL_ONLY[Billing Degraded]
DB[Database Failure] --> CORE[Core Service Degraded]
~~~

A failure domain should have the smallest possible blast radius.

## 16. Acceptance Criteria

- Performance targets are measured.
- Core failure domains are isolated.
- Critical data is durable.
- Tenant authorization remains strong under failure.
- Observability can trace important workflows.
- Recovery has tested procedures.
- Limits prevent unbounded resource consumption.
