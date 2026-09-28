# Requirement Traceability Matrix

> Status: **Target engineering governance artifact**

## 1. Purpose

Traceability prevents "implemented but not proven" and "documented but unimplemented" states.

## 2. Chain

~~~text
Requirement
 -> Design
 -> Domain Rule
 -> API/Event
 -> Code
 -> Test
 -> Runtime Metric
 -> Acceptance Evidence
~~~

## 3. Initial Matrix

| Requirement | Domain | Contract | Test family | Evidence |
|---|---|---|---|---|
| FR-TEN-001 | tenancy | signup/API | provisioning | DB + integration |
| FR-TEN-002 | tenancy/security | all scoped APIs | isolation | negative tests |
| FR-CONV-002 | conversations | webhook/events | dedupe | DB uniqueness |
| FR-CONV-003 | conversations/AI | message API | race | concurrency test |
| FR-ROUTE-001 | routing | routing decision | property | deterministic output |
| FR-AI-002 | AI/tools | tool runtime | privilege | authorization test |
| FR-AI-003 | AI runtime | ai.run events | recovery | crash test |
| FR-KNO-002 | knowledge/security | retrieval | tenant isolation | retrieval test |
| FR-TOOL-002 | tools | invocation | duplicate/timeout | reconciliation |
| FR-WORK-001 | workflows | workflow run | recovery | restart test |
| FR-WORK-002 | workflows | approval | mutation | approval hash test |
| FR-BILL-001 | billing | entitlement API | quota | concurrency |
| FR-BILL-002 | billing/paymob | payment event | reconciliation | provider fixture |
| FR-EVT-001 | events | outbox | fault injection | atomicity |
| FR-SEC-001 | security | audit | audit | event + DB |
| FR-OPS-001 | engineering | trace | integration | trace inspection |

## 4. Status Values

~~~text
specified
designed
implemented
tested
verified
released
~~~

A document update moves a requirement to specified/designed only. Code/tests are required to progress further.

## 5. Review Rule

Before declaring production readiness, no high-risk requirement may remain below verified.
