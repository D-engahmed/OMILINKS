# Event and Worker Runtime

### OML-T0501 — PostgreSQL outbox publisher

**Status:** BASELINE

**Dependencies:** OML-T0207

**Outcome:** Durable asynchronous publication with retry-safe progress.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0502 — Per-consumer event inbox

**Status:** BASELINE

**Dependencies:** OML-T0501

**Outcome:** Consumer-local dedupe and durable retry state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0503 — Leased work claiming

**Status:** BASELINE

**Dependencies:** OML-T0502

**Outcome:** Exclusive durable worker leases with reclaim after expiry.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0504 — Retry and dead-letter transitions

**Status:** BASELINE

**Dependencies:** OML-T0503

**Outcome:** Persisted backoff/retry counts and terminal dead-letter state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0505 — Authorized dead-letter replay

**Status:** BASELINE

**Dependencies:** OML-T0504, OML-T0106

**Outcome:** Permission-gated replay with causation traceability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0506 — Worker-instance leases and heartbeats

**Status:** BASELINE

**Dependencies:** OML-T0503

**Outcome:** Durable worker liveness and safe lease expiration.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0507 — Per-class concurrency limits

**Status:** BASELINE

**Dependencies:** OML-T0506

**Outcome:** Bounded concurrency and starvation-aware scheduling.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0508 — Production worker process entrypoint

**Status:** BASELINE

**Dependencies:** OML-T0501, OML-T0506

**Outcome:** Independent worker process with deterministic startup/shutdown.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0509 — Asynchronous routing worker

**Status:** BASELINE

**Dependencies:** OML-T0508, OML-T0409

**Outcome:** Routing executes outside HTTP and remains traceable/recoverable.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0510 — Event-runtime failure and recovery tests

**Status:** BASELINE

**Dependencies:** OML-T0504, OML-T0505, OML-T0509

**Outcome:** Duplicate, crash, retry, DLQ, and replay recovery tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
