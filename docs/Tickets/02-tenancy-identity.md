# Tenancy and Identity

### OML-T0101 — Organization aggregate

**Status:** BASELINE

**Dependencies:** OML-T0006

**Outcome:** Durable organization identity/lifecycle and organization-scoped ownership.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0102 — Membership model

**Status:** BASELINE

**Dependencies:** OML-T0101

**Outcome:** Multi-organization users, explicit membership state, revocation, and active-org selection outside memberships[0].

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0103 — Roles and permissions

**Status:** BASELINE

**Dependencies:** OML-T0102

**Outcome:** Server-side permissions independent from UI visibility.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0104 — Scope bindings and service principals

**Status:** BASELINE

**Dependencies:** OML-T0103

**Outcome:** Explicit organization scope for non-human actors without privilege inheritance.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0105 — Tenant request context

**Status:** BASELINE

**Dependencies:** OML-T0102, OML-T0103

**Outcome:** One authoritative organization context per request; fail closed on ambiguity.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0106 — Authorization engine

**Status:** BASELINE

**Dependencies:** OML-T0103, OML-T0105

**Outcome:** Principal/role/scope/resource/action authorization with stable deny semantics.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0107 — Tenant isolation and escalation tests

**Status:** BASELINE

**Dependencies:** OML-T0106

**Outcome:** Cross-tenant access, privilege escalation, and revoked-membership negative tests.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence

### OML-T0108 — Security-sensitive audit events

**Status:** BASELINE

**Dependencies:** OML-T0106

**Outcome:** Auditable membership/privilege changes with actor, org, action, and correlation data.

**Acceptance:** prove the outcome with implementation evidence, tests, negative cases, observability, and documentation updates where applicable.

**Delivery:** issue -> branch -> commit -> PR -> CI -> QA -> merge -> release evidence
