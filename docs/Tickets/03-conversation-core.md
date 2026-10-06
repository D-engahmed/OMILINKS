# Customer and Conversation Core

### OML-T0201 — Customer aggregate

**Status:** BASELINE

**Dependencies:** OML-T0107

**Outcome:** Organization-scoped durable customer identity and lifecycle.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0202 — Customer identity mapping

**Status:** BASELINE

**Dependencies:** OML-T0201

**Outcome:** External channel identities map deterministically to org-scoped customers.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0203 — Conversation aggregate and control state

**Status:** BASELINE

**Dependencies:** OML-T0201

**Outcome:** Durable conversation lifecycle and explicit human/AI control version.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0204 — Message model and delivery state

**Status:** BASELINE

**Dependencies:** OML-T0203

**Outcome:** Canonical inbound/outbound messages with extensible delivery state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0205 — Assignment and takeover transaction

**Status:** BASELINE

**Dependencies:** OML-T0203, OML-T0106

**Outcome:** Authoritative human takeover; stale AI actions rejected after control change.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0206 — Message idempotency

**Status:** BASELINE

**Dependencies:** OML-T0204

**Outcome:** Duplicate inbound delivery resolves to one canonical message.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0207 — Transactional outbox for domain events

**Status:** BASELINE

**Dependencies:** OML-T0204, OML-T0003

**Outcome:** Business state and outbox record commit atomically.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0208 — Conversation core integration tests

**Status:** BASELINE

**Dependencies:** OML-T0205, OML-T0206, OML-T0207

**Outcome:** Duplicate ingress, takeover race, and atomic outbox scenarios automated.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
