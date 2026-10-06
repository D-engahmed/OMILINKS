# Engineering Foundation

### OML-T0001 — Repository module boundaries

**Status:** BASELINE

**Dependencies:** OML-T0000

**Outcome:** Explicit API/worker/domain/infrastructure/shared ownership and import direction.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0002 — Configuration and environment validation

**Status:** BASELINE

**Dependencies:** OML-T0001

**Outcome:** Fail-fast required configuration; distinct dev/test/prod contracts; no secret leakage.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0003 — Database migration system

**Status:** BASELINE

**Dependencies:** OML-T0001

**Outcome:** Versioned migrations; fresh-database bootstrap; CI migration validation.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0004 — Structured logging and correlation

**Status:** BASELINE

**Dependencies:** OML-T0002

**Outcome:** Structured logs and request/correlation identity across HTTP and async work.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0005 — Test harness and CI gates

**Status:** BASELINE

**Dependencies:** OML-T0003, OML-T0004

**Outcome:** Clean lint, typecheck, test, and build gates with reproducible failure output.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0006 — Local development infrastructure

**Status:** BASELINE

**Dependencies:** OML-T0003, OML-T0005

**Outcome:** Reproducible PostgreSQL/Redis environment and reset/reseed workflow.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
