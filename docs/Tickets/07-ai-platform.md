# AI Platform

### OML-T0601 — AI model registry

**Status:** BASELINE

**Dependencies:** OML-T0509

**Outcome:** Durable model/provider metadata with credential references and pricing metadata.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0602 — Versioned model policy and deterministic failover

**Status:** BASELINE

**Dependencies:** OML-T0601

**Outcome:** Policy-driven model selection and deterministic provider fallback.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0603 — AI agent identity and governance

**Status:** BASELINE

**Dependencies:** OML-T0106, OML-T0601

**Outcome:** Org-scoped agents with versioned governance and no privilege inheritance.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0604 — Agent execution policy

**Status:** BASELINE

**Dependencies:** OML-T0603, OML-T0602

**Outcome:** Explicit autonomy, retrieval, history, budget, and guardrail controls.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0605 — AI input/output guardrails

**Status:** BASELINE

**Dependencies:** OML-T0604

**Outcome:** Independent safety checks with block/handoff outcomes and traceability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0606 — Durable AI run traceability and cost attribution

**Status:** BASELINE

**Dependencies:** OML-T0604, OML-T0605

**Outcome:** Persist agent/policy/model/usage/cost and provider failure outcomes.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0607 — AI evaluation kernel and regression evidence

**Status:** BASELINE

**Dependencies:** OML-T0606

**Outcome:** Versioned evaluation datasets/metrics and regression promotion.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0608 — Authenticated AI APIs

**Status:** BASELINE

**Dependencies:** OML-T0603, OML-T0606, OML-T0607

**Outcome:** Scoped AI configuration, execution, and evaluation APIs.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0609 — Governed context assembly

**Status:** BASELINE

**Dependencies:** OML-T0604, OML-T0608

**Outcome:** Authorized tenant context with explicit history/knowledge budgets and prompt versioning.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0610 — Tool runtime authorization kernel

**Status:** BASELINE

**Dependencies:** OML-T0605, OML-T0609

**Outcome:** Registry/schema/scope/auth/entitlement/risk/idempotency checks before tool execution.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0611 — Embedding provider registry

**Status:** DEFERRED

**Dependencies:** OML-T0607

**Outcome:** Provider-neutral embeddings with versioned credentials and reproducible migration.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0612 — Advanced quality-based model routing

**Status:** DEFERRED

**Dependencies:** OML-T0602, OML-T0607

**Outcome:** Quality/latency/cost routing without bypassing hard policy gates.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0613 — Multi-agent orchestration

**Status:** DEFERRED

**Dependencies:** OML-T0610

**Outcome:** Explicit inter-agent authorization, shared budget propagation, and recursion limits.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

AI platform: model routing, usage limits, guardrails, fallback, and traceability are direct COGS controls and margin controls.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).
