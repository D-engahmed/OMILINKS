# Workforce and Routing

### OML-T0401 — Workforce member aggregate

**Status:** BASELINE

**Dependencies:** OML-T0205

**Outcome:** Durable operational workforce state distinct from user membership.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0402 — Skills and proficiency

**Status:** BASELINE

**Dependencies:** OML-T0401

**Outcome:** Org-scoped skill requirements and deterministic proficiency use.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0403 — Presence with TTL

**Status:** BASELINE

**Dependencies:** OML-T0401

**Outcome:** Leased presence that expires and cannot remain routable.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0404 — Agent capacity accounting

**Status:** BASELINE

**Dependencies:** OML-T0403

**Outcome:** Bounded capacity with race-safe allocation and deterministic release.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0405 — Teams and queues

**Status:** BASELINE

**Dependencies:** OML-T0401

**Outcome:** Org-scoped teams/queues and no-candidate fallback.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0406 — Versioned routing policy

**Status:** BASELINE

**Dependencies:** OML-T0402, OML-T0405

**Outcome:** Immutable published routing policies with reproducible inputs/outputs.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0407 — Deterministic routing evaluation

**Status:** BASELINE

**Dependencies:** OML-T0403, OML-T0404, OML-T0406

**Outcome:** Stable candidate filtering and deterministic fallback.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0408 — Routing decision and candidate snapshot

**Status:** BASELINE

**Dependencies:** OML-T0407

**Outcome:** Explainable chosen/rejected candidate snapshot with policy version.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0409 — Transactional assignment commit

**Status:** BASELINE

**Dependencies:** OML-T0408, OML-T0205

**Outcome:** Race-safe atomic assignment, capacity, and control update.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0410 — Escalation policy engine

**Status:** TARGET

**Dependencies:** OML-T0407, OML-T0409

**Outcome:** Versioned escalation thresholds without bypassing authorization/handoff controls.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
