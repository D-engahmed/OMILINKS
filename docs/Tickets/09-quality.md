# Quality

### OML-T0801 — Versioned quality scorecards

**Status:** BASELINE

**Dependencies:** OML-T0710

**Outcome:** Immutable published scorecards and durable calculation policy.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0802 — Deterministic quality sampling

**Status:** BASELINE

**Dependencies:** OML-T0801

**Outcome:** Versioned, idempotent sampling rules.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0803 — Quality evaluation state machine

**Status:** BASELINE

**Dependencies:** OML-T0802

**Outcome:** Explicit review lifecycle with guarded transitions.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0804 — Conversation-scoped evaluation evidence

**Status:** BASELINE

**Dependencies:** OML-T0803

**Outcome:** Every finding references organization-safe conversation evidence.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0805 — Reproducible scoring calculation

**Status:** BASELINE

**Dependencies:** OML-T0804

**Outcome:** Results reproducible from stored scorecard version.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0806 — AI proposal fencing

**Status:** BASELINE

**Dependencies:** OML-T0805, OML-T0607

**Outcome:** AI evaluations remain proposals until authorized completion.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0807 — Finding-linked remediation workflow

**Status:** BASELINE

**Dependencies:** OML-T0806

**Outcome:** Guarded remediation lifecycle linked to findings.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0808 — Quality kernel parity and negative tests

**Status:** BASELINE

**Dependencies:** OML-T0807

**Outcome:** Memory/PostgreSQL parity and negative regression coverage.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0809 — Quality analytics and calibration

**Status:** DEFERRED

**Dependencies:** OML-T0808

**Outcome:** Analytics/calibration added only when review volume justifies them.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Quality: QA evidence must connect to resolution rate, handoff reduction, retention, and support cost without creating unbounded review cost.

This ticket is not complete when the code exists. Record the economic effect, expected cost behavior, duplicate/retry risk, measurement instrumentation, and the downstream finance ticket/report that consumes the evidence. Use [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).
