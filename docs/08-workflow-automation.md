# OmniLinks Workflow and Automation

## Purpose

Automation owns deterministic business orchestration.

LLMs may provide reasoning, classification or content generation, but authorization and critical state transitions remain explicit.

## Workflow

A workflow contains:
- trigger
- immutable version
- conditions
- ordered steps
- failure policy
- retry policy

## Triggers

Initial triggers:
- conversation.created
- message.received
- conversation.assigned
- conversation.escalated
- conversation.resolved
- SLA.warning
- SLA.breached
- customer.created
- webhook.received
- scheduled

## Steps

- condition
- send message
- assign
- invoke AI
- execute action
- call webhook
- wait
- notify
- escalate
- terminate

## Execution

    event
      -> select active workflows
      -> evaluate scope
      -> create durable workflow run
      -> execute step
      -> persist result
      -> schedule next step

Workflow runs must survive worker restarts.

## Idempotency

Duplicate triggers must not duplicate side effects.

Use a deterministic execution key derived from workflow version, trigger event and tenant/resource scope.

## Failure

Every external step has:
- timeout
- retry policy
- retry count
- backoff
- terminal state

Failures must create observable operational state.

## Approvals

A workflow action may create an approval request.

    pending
      -> approved
      -> executed

or

    pending
      -> rejected

Approval identity and time are recorded.

## n8n

n8n is an integration/automation dependency, not the system of record.

OmniLinks owns:
- tenant scope
- security
- customer/conversation state
- authorization
- event semantics
- audit

n8n may own execution of an external workflow.

## V1 UI

Use structured rule forms first.

A visual workflow editor is a later presentation layer over the same versioned domain model.
