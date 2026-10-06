# Billing

### OML-T0901 — Billing domain model

**Status:** TARGET

**Dependencies:** OML-T0808

**Outcome:** Explicit ownership/invariants for plans, entitlements, subscriptions, usage, payments, invoices.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0902 — Plan catalog and versioning

**Status:** TARGET

**Dependencies:** OML-T0901

**Outcome:** Data-driven versioned prices and limits.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0903 — Entitlement resolution engine

**Status:** TARGET

**Dependencies:** OML-T0902

**Outcome:** Effective entitlements derive from authoritative subscription state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0904 — Subscription state machine

**Status:** TARGET

**Dependencies:** OML-T0903

**Outcome:** Explicit lifecycle states, legal transitions, and auditability.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0905 — Immutable usage event model

**Status:** TARGET

**Dependencies:** OML-T0904

**Outcome:** Durable org-scoped usage events with idempotency identity.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0906 — Usage aggregation and metering

**Status:** TARGET

**Dependencies:** OML-T0905

**Outcome:** Reproducible billing-period aggregates without double-counting.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0907 — Payment provider abstraction

**Status:** TARGET

**Dependencies:** OML-T0904

**Outcome:** Provider-neutral payment interface and normalized provider states.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0908 — Paymob payment creation

**Status:** TARGET

**Dependencies:** OML-T0907

**Outcome:** Idempotency-aware payment initiation and provider reference persistence.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0909 — Payment webhook ingestion

**Status:** TARGET

**Dependencies:** OML-T0908, OML-T0304

**Outcome:** Validated, deduplicated provider callbacks.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0910 — Payment reconciliation

**Status:** TARGET

**Dependencies:** OML-T0909

**Outcome:** Internal/provider state reconciliation with durable mismatches.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0911 — Invoice and payment history

**Status:** TARGET

**Dependencies:** OML-T0904, OML-T0906, OML-T0910

**Outcome:** Tenant-safe historical billing records with minimal sensitive data.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0912 — Billing API and operator UI

**Status:** TARGET

**Dependencies:** OML-T0903, OML-T0911

**Outcome:** Tenant-authorized billing APIs/UI reflecting authoritative state.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0913 — Billing observability and reconciliation metrics

**Status:** TARGET

**Dependencies:** OML-T0910

**Outcome:** Payment, webhook, usage, cost, and reconciliation telemetry.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0914 — Billing end-to-end and failure tests

**Status:** TARGET

**Dependencies:** OML-T0912, OML-T0913

**Outcome:** Subscribe/pay/callback/entitlement, duplicate, failure, and mismatch tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
