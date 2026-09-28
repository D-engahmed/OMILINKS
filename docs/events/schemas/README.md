# Event Schema Registry

> Status: **Target contract with concrete v1 schemas**

This directory is the schema boundary for events. Every production event type should have a JSON Schema and representative fixtures.

## Current v1 schemas

- event-envelope.v1.json
- conversation.message.received.v1.json
- ai.run.completed.v1.json
- subscription.changed.v1.json
- usage.recorded.v1.json
- fixtures/conversation.message.received.v1.json

## Compatibility rules

- additive optional fields are preferred;
- changing field meaning requires a new version;
- removing a required field is breaking;
- changing enum semantics is breaking;
- unit changes are breaking;
- every schema change requires producer/consumer contract tests.

## CI contract

~~~mermaid
flowchart LR
SCHEMA[JSON Schema] --> VALIDATE[Producer Validation]
VALIDATE --> FIXTURE[Representative Fixture]
FIXTURE --> COMPAT[Consumer Compatibility]
COMPAT --> CI[CI Gate]
CI --> MERGE[Merge]
~~~

## Required test cases

Each production event should test:

- minimum valid payload;
- full valid payload;
- invalid required field;
- invalid tenant identity;
- boundary values;
- additive field compatibility;
- duplicate delivery behavior.

## Security

Event schemas must reject or omit:

- secrets;
- authentication tokens;
- raw provider credentials;
- unbounded binary content.

Large payloads are durable references, not embedded event content.
