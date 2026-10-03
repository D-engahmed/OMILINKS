# Phase 8 — Quality

> Status: Implemented vertical slice (kernel)

Phase 8 turns sampled conversations into reproducible, evidence-linked quality
evaluations with a traceable remediation path.

```text
Scorecard version (published)
  -> Sampling rule (deterministic)
  -> Sample decision (idempotent)
  -> Evaluation (QUEUED -> ASSIGNED -> IN_REVIEW -> SUBMITTED -> COMPLETED)
  -> Findings (criterion scores + message evidence)
  -> Remediation (OPEN -> IN_PROGRESS -> DONE)
```

## 1. Score model

`v1` calculation policy, stored on every scorecard version:

```text
total = sum(criterion_score * weight) / sum(weights), rounded to 4dp
critical_failure = any critical criterion scored below 1
```

Published versions are immutable. Publishing a new version retires the previous
one. Recomputing from the stored version criteria reproduces the stored total.

## 2. Deterministic sampling

`RANDOM` draws `sha256(seed + ":" + conversationId) mod 1000 < rate_per_mille`.
`MANUAL` selects explicitly. `HANDOFF_TRIGGERED` selects conversations that
have a handoff. The rule id, decision, reason, and seed are persisted per
conversation, and re-running sampling returns the same decisions
(`ON CONFLICT DO NOTHING` + read-back in PostgreSQL, find-before-create in
memory).

## 3. Human vs AI evaluations

`evaluator_type` is `HUMAN` or `AI`. AI evaluations are proposals: they can be
drafted, assigned, reviewed, and submitted, but completion is rejected with
`QUALITY_AI_PROPOSAL_NOT_FINAL`. A human evaluation links its proposal through
`ai_proposal_id`. This keeps AI assistance visible without letting it close
quality records.

## 4. Evidence rule

Every finding references source messages. Each referenced message must exist in
the same organization **and** the evaluated conversation, otherwise submission
fails with `QUALITY_EVIDENCE_NOT_FOUND`. Evaluations store references and
reviewer interpretation, never rewritten copies of source records.

## 5. Concurrency

State transitions are guarded by optimistic `version` checks
(`STALE_QUALITY_EVALUATION_VERSION`) and row locks in PostgreSQL (`FOR UPDATE`).
Remediation transitions are `OPEN -> IN_PROGRESS -> DONE`, with `CANCELED`
allowed from either open state; terminal states reject further transitions.

## 6. Tenant isolation

All seven quality tables carry `organization_id`, composite owner foreign keys,
and forced RLS. Cross-tenant reads return `null`/empty; writes fail on owner
foreign keys. Configuration and review use the `quality.manage` permission
(OWNER/ADMIN/SUPERVISOR; AGENT excluded).

## 7. API surface

```text
GET/POST /api/v1/quality/scorecards/versions
GET      /api/v1/quality/scorecards
GET      /api/v1/quality/scorecards/{id}/versions
POST     /api/v1/quality/scorecards/{id}/versions/{vid}/publish
GET/POST /api/v1/quality/sample-rules
POST     /api/v1/quality/sample-rules/{id}/sample
GET      /api/v1/quality/sample-rules/{id}/samples
GET/POST /api/v1/quality/evaluations
GET      /api/v1/quality/evaluations/{id}
POST     /api/v1/quality/evaluations/{id}/{assign,begin,submit,return,complete,cancel}
POST     /api/v1/quality/remediations
GET      /api/v1/quality/findings/{id}/remediations
PUT      /api/v1/quality/remediations/{id}/status
```

## 8. Testing

Phase 8 tests cover:

```text
version publish/retire immutability
draft-version evaluation rejection
deterministic + idempotent sampling
full human review with score recomputation
conversation-scoped evidence rejection
stale-version conflicts
AI-proposal completion rejection
remediation linkage and terminal guards
cross-tenant isolation
HTTP authentication and tenant scope
memory/PostgreSQL parity
```

## 9. Deliberately deferred

```text
calibration (dual-review disagreement/adjudication)
weighted/stratified sampling beyond handoff triggers
AI-proposed findings generation
analytics rollups (reviewer utilization, critical-finding rate)
```

Calibration and analytics become their own slices once review volume justifies
them. The schema versions cleanly: new tables reference `quality_evaluations`
by `(id, organization_id)`.

## 10. Engineering mental model

```text
Published rubric
  ↓
Deterministic sample
  ↓
Versioned review
  ↓
Evidence-linked score
  ↓
Traceable remediation
```

Quality observes operations. It never mutates conversations, messages, or AI
runs.
