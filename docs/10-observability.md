# OmniLinks Observability

## Goal

Observability connects system failures to business impact.

## Correlation

Carry where applicable:
- requestId
- traceId
- organizationId
- principalId
- correlationId
- causationId

Across HTTP requests, jobs, events, AI runs and provider calls.

## Structured logs

Recommended fields:
- timestamp
- level
- module
- operation
- requestId
- organizationId
- resourceId
- status
- latency
- errorCode

Do not log raw customer content by default.

## Metrics

System:
- request rate
- error rate
- latency
- DB latency
- queue depth
- worker failures

Channels:
- webhook rate
- webhook failures
- outbound attempts
- delivery rate
- provider errors
- delivery latency

AI:
- runs
- success/failure
- latency
- token usage
- cost
- tool calls
- escalation rate

Business:
- first response time
- resolution time
- SLA compliance
- AI containment
- human takeover
- cost per resolved interaction

## Tracing

Important traces:

    HTTP
      -> domain mutation
      -> outbox/event
      -> worker
      -> AI
      -> retrieval
      -> tool
      -> external API

## Alerts

Alert on operational impact:
- webhook failure spikes
- delivery failures
- queue backlog
- AI provider outage
- database saturation
- billing reconciliation failures
- repeated authorization denials

Tune thresholds from production baseline data.

## Health

Provide:
- liveness
- readiness
- dependency health

Health responses must not expose secrets.

## Logs versus audit

Logs are diagnostic.

Audit events are security/business evidence.

Never substitute application logs for audit records.
