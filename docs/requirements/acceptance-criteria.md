# Acceptance Criteria — Engineering Verification Specification

> Status: **Target release gate**

## 1. Verification Model

Every criterion has:

~~~text
Given
When
Then
Evidence
Failure Mode
~~~

Manual screenshots are not sufficient proof for security, billing, concurrency or data-integrity criteria.

## 2. Security Criteria

### AC-SEC-001 Cross-Tenant Read

Given a resource owned by Organization A, when a principal in Organization B requests it, then no protected data is disclosed.

Evidence: automated negative test.

### AC-SEC-002 Scope Escape

Given a team-scoped principal, when it requests a resource outside its scope, then the operation is denied.

Evidence: authorization test.

### AC-SEC-003 AI Privilege Escalation

Given an AI agent configured by an administrator, when the agent requests an administrator-only tool, then execution is denied.

Evidence: tool-runtime test.

## 3. Conversation Criteria

### AC-CONV-001 Duplicate Inbound

Given an already processed provider event, when the provider retries the event, then exactly one canonical message exists.

Evidence: database constraint + integration test.

### AC-CONV-002 Human Takeover

Given an AI run started under control version N, when a human takes control and increments the version, then the stale run cannot create a customer-visible send.

Evidence: race/concurrency test.

### AC-CONV-003 Unknown Delivery

Given provider timeout after a potentially successful send, then the message enters reconciliation/unknown state and is not blindly duplicated.

Evidence: provider fault injection.

## 4. Routing Criteria

### AC-ROUTE-001 Deterministic Decision

Given identical policy/context/candidate snapshot, repeated routing produces the same decision.

Evidence: repeated/property test.

### AC-ROUTE-002 No-Match

Given zero eligible candidates, routing creates durable queue state.

Evidence: integration test.

## 5. AI Criteria

### AC-AI-001 Version Traceability

Given a completed run, the system can identify agent policy, prompt, model route, tool versions and knowledge snapshot.

Evidence: persisted run record.

### AC-AI-002 Guardrail Failure

Given high-risk guardrail dependency failure, a high-risk action fails closed.

Evidence: fault injection.

### AC-AI-003 Budget Termination

Given a run reaches its hard budget, execution stops before another expensive step.

Evidence: deterministic runtime test.

## 6. Workflow Criteria

### AC-WF-001 Crash Recovery

Given a worker crashes after persisting a StepRun, recovery resumes from the latest safe state without duplicating side effects.

Evidence: worker crash test.

### AC-WF-002 Approval Integrity

Given approval for action hash H, a modified action with hash H2 cannot execute using the old approval.

Evidence: approval test.

## 7. Knowledge Criteria

### AC-KNO-001 Tenant Isolation

Given knowledge owned by Organization A, a retrieval request in Organization B cannot receive the content.

Evidence: retrieval security test.

### AC-KNO-002 Deletion Safety

Given a source is disabled, retrieval stops before derived index cleanup completes.

Evidence: stale-index test.

## 8. Billing Criteria

### AC-BILL-001 Payment Authority

Given a browser reaches payment success redirect without verified provider event, subscription remains unactivated.

Evidence: billing integration test.

### AC-BILL-002 Duplicate Webhook

Given the same payment event arrives twice, the financial result is applied once.

Evidence: idempotency test.

### AC-BILL-003 Quota Race

Given two concurrent consumers against the last available quota unit, the system prevents silent over-consumption beyond the enforced limit.

Evidence: concurrency test.

## 9. Event Criteria

### AC-EVT-001 Atomic Outbox

Given transaction failure, business state and outbox record do not diverge.

Evidence: transaction fault injection.

### AC-EVT-002 Duplicate Consumer

Given the same event is delivered twice, the consumer does not create duplicate side effects.

Evidence: contract/integration test.

## 10. Operations Criteria

### AC-OPS-001 Traceability

Given a customer operation traverses API, queue, AI and provider, an operator can correlate those stages using the request/correlation ID.

Evidence: trace inspection.

### AC-OPS-002 Restore

Given a production recovery point, restore verifies schema, tenant isolation and external reconciliation before reopening service.

Evidence: restore drill.

## 11. Release Rule

No production release may declare a criterion complete solely because the happy path works. Failure, concurrency, authorization and recovery evidence are part of acceptance.
