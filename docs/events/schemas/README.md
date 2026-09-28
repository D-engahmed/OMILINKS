# Event Schema Directory

> Status: **Target production contract**

This directory contains JSON Schemas for events crossing domain, worker and integration boundaries.

## 1. Naming

Use:

~~~text
<event-name>.v<version>.json
~~~

Examples:

- conversation.message.received.v1.json
- conversation.message.sent.v1.json
- ai.run.completed.v1.json
- workflow.run.completed.v1.json
- subscription.changed.v1.json
- usage.recorded.v1.json

## 2. Envelope

Each schema validates the common envelope:

- event_id;
- event_type;
- version;
- occurred_at;
- organization_id when tenant-owned;
- actor;
- correlation_id;
- causation_id where applicable;
- data;
- metadata.

## 3. Business Payload

The data section contains business semantics, not database implementation details.

A schema should not expose:

- database passwords;
- API keys;
- provider bearer tokens;
- unbounded raw provider payloads;
- internal stack traces.

## 4. Compatibility

Prefer additive changes within a version.

Breaking examples:

- changing customer_id meaning;
- changing a status enum meaning;
- removing a required field;
- changing units without versioning.

Such changes require a new version.

## 5. Contract Testing

~~~mermaid
flowchart LR
SCHEMA[JSON Schema] --> PRODUCER[Producer Validation]
PRODUCER --> EVENT[Published Event]
EVENT --> CONSUMER[Consumer Validation]
CONSUMER --> HANDLER[Handler]
SCHEMA --> FIXTURE[Versioned Fixtures]
FIXTURE --> CI[CI Compatibility Test]
~~~

Fixtures should cover:

- minimal valid event;
- full valid event;
- optional fields;
- boundary values;
- additive fields where tolerated;
- invalid payload;
- tenant isolation cases.

## 6. Producer Responsibility

Producers validate before publication. A malformed event is a producer defect.

## 7. Consumer Responsibility

Consumers validate at ingestion and fail safely if the payload is incompatible.

Consumer failure should result in a retry/dead-letter state, not an acknowledgement that discards the event.

## 8. Acceptance Criteria

- Every production event type has a versioned schema.
- Producer and consumer tests use fixtures.
- Breaking semantic changes create a new version.
- Schema validation excludes secrets.
- CI checks compatibility before merge.