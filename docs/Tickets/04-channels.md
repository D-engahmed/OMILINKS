# Channels and Webhooks

### OML-T0301 — Channel adapter contract

**Status:** BASELINE

**Dependencies:** OML-T0208

**Outcome:** Common verification, normalization, ingress, delivery, retry, and failure contract.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0302 — Web Widget tenant configuration

**Status:** BASELINE

**Dependencies:** OML-T0301, OML-T0105

**Outcome:** Org-scoped widget configuration and server-side origin validation.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0303 — Widget public message ingress

**Status:** BASELINE

**Dependencies:** OML-T0302, OML-T0206, OML-T0207

**Outcome:** Validated ingress normalizes to canonical messages and returns accepted semantics.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0304 — Provider-event dedupe ledger

**Status:** BASELINE

**Dependencies:** OML-T0303

**Outcome:** Durable provider event deduplication and replay safety.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0305 — Retryable webhook ingress lease

**Status:** BASELINE

**Dependencies:** OML-T0304

**Outcome:** Retryable webhook work with expiring leases and duplicate-side-effect protection.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0306 — Outbound delivery boundary

**Status:** TARGET

**Dependencies:** OML-T0301, OML-T0204, OML-T0207

**Outcome:** Durable outbound delivery attempts separated from conversation persistence.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0307 — WhatsApp provider adapter

**Status:** TARGET

**Dependencies:** OML-T0306

**Outcome:** WhatsApp verification, normalization, outbound delivery, and failure behavior.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0308 — Channel adapter contract tests

**Status:** BASELINE

**Dependencies:** OML-T0303, OML-T0304, OML-T0305

**Outcome:** Reusable positive and negative adapter contract tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence


## Financial Integration

Channels: each provider creates delivery cost, payment/channel dependency, reconciliation exposure, and customer acquisition implications.

Before marking any ticket in this track DONE, document:

- expected one-time engineering cost;
- expected recurring infrastructure/provider cost;
- variable cost created per customer, conversation, message, run, or action where applicable;
- failure/retry behavior that could duplicate cost or revenue;
- observability required to measure the economic effect;
- which finance ticket or model output consumes the evidence.

Required chain: specification -> implementation -> tests -> measured evidence -> financial effect -> management decision. See [Finance & Commercial Control](./12-finance-commercial-control.md) and [Financial Model](../finance/financial-model.md).
