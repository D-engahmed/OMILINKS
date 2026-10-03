import assert from "node:assert/strict"
import { test } from "node:test"

import { QualityService, calculateTotal } from "./application/quality.js"
import type { Store } from "./infrastructure/store.js"
import { createApp } from "./app.js"
import { storeTest } from "./test-support.js"

async function signup(store: Store, name = "Quality Org", email = "quality@example.com") {
  const app = await createApp(store)
  const response = await app(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: name,
        email,
        displayName: "Quality Owner",
      }),
    })
  )
  assert.equal(response.status, 201)
  return {
    app,
    ...(await response.json()) as {
      organization: { id: string }
      user: { id: string }
      session: { accessToken: string }
    },
  }
}

function criteria() {
  return [
    { key: "greeting", name: "Greeting", weight: 1, critical: false },
    { key: "accuracy", name: "Accuracy", weight: 3, critical: true },
  ]
}

async function rejectsWithCode(promise: Promise<unknown>, code: string): Promise<void> {
  try {
    await promise
  } catch (error) {
    const actual =
      error instanceof Error && "code" in error
        ? String((error as { code: unknown }).code)
        : ""
    const message = error instanceof Error ? error.message : String(error)
    assert.ok(
      actual === code || message.includes(code),
      `expected rejection ${code}, got ${actual || message}`
    )
    return
  }
  assert.fail(`expected rejection with ${code}`)
}

async function conversationWithMessage(store: Store, organizationId: string) {
  const customer = await store.createCustomer({
    organizationId,
    displayName: "QA Customer",
    provider: "widget",
    providerAccountId: "acct",
    externalId: "visitor-" + Math.random().toString(36).slice(2),
  })
  const conversation = await store.createConversation({
    organizationId,
    customerId: customer.id,
    channel: "widget",
  })
  const { message } = await store.appendMessage({
    organizationId,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "Where is my order?",
    clientMessageId: null,
  })
  return { customer, conversation, message }
}

async function publishedVersion(service: QualityService, organizationId: string) {
  const created = await service.createScorecardVersion({
    organizationId,
    name: "Support QA",
    criteria: criteria(),
  })
  return {
    scorecard: created.scorecard,
    version: await service.publishScorecardVersion(
      organizationId,
      created.scorecard.id,
      created.version.id
    ),
  }
}

storeTest("phase 8: publishing a new version retires the previous one", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)

  const created = await service.createScorecardVersion({
    organizationId: owner.organization.id,
    name: "Support QA",
    criteria: criteria(),
  })
  assert.equal(created.version.status, "DRAFT")
  const v1 = await service.publishScorecardVersion(owner.organization.id, created.scorecard.id, created.version.id)
  assert.equal(v1.status, "PUBLISHED")

  const second = await service.createScorecardVersion({
    organizationId: owner.organization.id,
    name: "Support QA",
    criteria: criteria(),
  })
  assert.equal(second.version.version, 2)
  await service.publishScorecardVersion(owner.organization.id, created.scorecard.id, second.version.id)
  const versions = await store.listQualityScorecardVersions(owner.organization.id, created.scorecard.id)
  assert.equal(versions.find((item) => item.id === v1.id)?.status, "RETIRED")
})

storeTest("phase 8: evaluations require a published scorecard version", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const { conversation } = await conversationWithMessage(store, owner.organization.id)

  const created = await service.createScorecardVersion({
    organizationId: owner.organization.id,
    name: "Support QA",
    criteria: criteria(),
  })
  await rejectsWithCode(
    service.createEvaluation({
      organizationId: owner.organization.id,
      conversationId: conversation.id,
      scorecardVersionId: created.version.id,
      sampleId: null,
      evaluatorType: "HUMAN",
      aiProposalId: null,
    }),
    "QUALITY_VERSION_NOT_PUBLISHED"
  )
})

storeTest("phase 8: sampling is deterministic and idempotent", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const first = await conversationWithMessage(store, owner.organization.id)
  const second = await conversationWithMessage(store, owner.organization.id)

  const rule = await service.createSampleRule({
    organizationId: owner.organization.id,
    name: "random-10pct",
    strategy: "RANDOM",
    ratePerMille: 100,
    seed: "seed-1",
  })
  const run = await service.sampleConversations({
    organizationId: owner.organization.id,
    ruleId: rule.id,
    conversationIds: [first.conversation.id, second.conversation.id],
  })
  const rerun = await service.sampleConversations({
    organizationId: owner.organization.id,
    ruleId: rule.id,
    conversationIds: [first.conversation.id, second.conversation.id],
  })
  assert.deepEqual(
    run.map((item) => item.sample.decision),
    rerun.map((item) => item.sample.decision)
  )
  assert.ok(rerun.every((item) => item.created === false))

  const manual = await service.createSampleRule({
    organizationId: owner.organization.id,
    name: "manual",
    strategy: "MANUAL",
    ratePerMille: 0,
    seed: "",
  })
  const manualRun = await service.sampleConversations({
    organizationId: owner.organization.id,
    ruleId: manual.id,
    conversationIds: [first.conversation.id],
  })
  assert.equal(manualRun[0]?.sample.decision, "SELECTED")
})

storeTest("phase 8: human review completes with a reproducible score", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const { conversation, message } = await conversationWithMessage(store, owner.organization.id)
  const { version } = await publishedVersion(service, owner.organization.id)

  const reviewer = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    displayName: "Reviewer",
    userId: null,
    type: "HUMAN",
  })
  const created = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: null,
  })
  const assigned = await store.assignQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    reviewerMemberId: reviewer.id,
    expectedVersion: 1,
  })
  const inReview = await store.beginQualityReview({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: assigned.version,
  })
  const { evaluation } = await service.submitFindings({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: inReview.version,
    findings: [
      { criterionKey: "greeting", score: 1, notes: null, evidence: [{ messageId: message.id }] },
      { criterionKey: "accuracy", score: 0.5, notes: "partial", evidence: [{ messageId: message.id }] },
    ],
  })
  assert.equal(evaluation.status, "SUBMITTED")
  assert.equal(evaluation.criticalFailure, true)
  // (1*1 + 0.5*3) / 4 = 0.625
  assert.equal(evaluation.totalScore, 0.625)

  const detail = await service.getEvaluation(owner.organization.id, created.id)
  const recomputed = calculateTotal(
    detail.scorecardVersion?.criteria ?? [],
    new Map(detail.findings.map((finding) => [finding.criterionKey, finding.score]))
  )
  assert.equal(recomputed.totalScore, detail.evaluation.totalScore)
  assert.equal(detail.findings.length, 2)
  assert.ok(detail.findings.every((finding) => finding.evidence.length === 1))

  const completed = await store.completeQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: evaluation.version,
  })
  assert.equal(completed.status, "COMPLETED")
})

storeTest("phase 8: evidence must belong to the evaluated conversation", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const target = await conversationWithMessage(store, owner.organization.id)
  const other = await conversationWithMessage(store, owner.organization.id)
  const { version } = await publishedVersion(service, owner.organization.id)

  const created = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: target.conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: null,
  })
  const assigned = await store.assignQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    reviewerMemberId: (await store.createWorkforceMember({
      organizationId: owner.organization.id,
      displayName: "Reviewer",
      userId: null,
      type: "HUMAN",
    })).id,
    expectedVersion: 1,
  })
  const inReview = await store.beginQualityReview({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: assigned.version,
  })
  await rejectsWithCode(
    service.submitFindings({
      organizationId: owner.organization.id,
      evaluationId: created.id,
      expectedVersion: inReview.version,
      findings: [
        { criterionKey: "greeting", score: 1, notes: null, evidence: [{ messageId: other.message.id }] },
        { criterionKey: "accuracy", score: 1, notes: null, evidence: [] },
      ],
    }),
    "QUALITY_EVIDENCE_NOT_FOUND"
  )
})

storeTest("phase 8: stale reviewer submissions are rejected", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const { conversation, message } = await conversationWithMessage(store, owner.organization.id)
  const { version } = await publishedVersion(service, owner.organization.id)

  const created = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: null,
  })
  const reviewerId = (await store.createWorkforceMember({
    organizationId: owner.organization.id,
    displayName: "Reviewer",
    userId: null,
    type: "HUMAN",
  })).id
  const assigned = await store.assignQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    reviewerMemberId: reviewerId,
    expectedVersion: 1,
  })
  await rejectsWithCode(
    store.beginQualityReview({
      organizationId: owner.organization.id,
      evaluationId: created.id,
      expectedVersion: 1,
    }),
    "STALE_QUALITY_EVALUATION_VERSION"
  )
  const inReview = await store.beginQualityReview({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: assigned.version,
  })
  await rejectsWithCode(
    service.submitFindings({
      organizationId: owner.organization.id,
      evaluationId: created.id,
      expectedVersion: assigned.version,
      findings: [
        { criterionKey: "greeting", score: 1, notes: null, evidence: [{ messageId: message.id }] },
        { criterionKey: "accuracy", score: 1, notes: null, evidence: [] },
      ],
    }),
    "STALE_QUALITY_EVALUATION_VERSION"
  )
  assert.equal(inReview.status, "IN_REVIEW")
})

storeTest("phase 8: AI evaluations are proposals and cannot be completed", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const { conversation, message } = await conversationWithMessage(store, owner.organization.id)
  const { version } = await publishedVersion(service, owner.organization.id)

  const proposal = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "AI",
    aiProposalId: null,
  })
  const reviewerId = (await store.createWorkforceMember({
    organizationId: owner.organization.id,
    displayName: "Reviewer",
    userId: null,
    type: "HUMAN",
  })).id
  const assigned = await store.assignQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: proposal.id,
    reviewerMemberId: reviewerId,
    expectedVersion: 1,
  })
  const inReview = await store.beginQualityReview({
    organizationId: owner.organization.id,
    evaluationId: proposal.id,
    expectedVersion: assigned.version,
  })
  const submitted = await service.submitFindings({
    organizationId: owner.organization.id,
    evaluationId: proposal.id,
    expectedVersion: inReview.version,
    findings: [
      { criterionKey: "greeting", score: 1, notes: null, evidence: [{ messageId: message.id }] },
      { criterionKey: "accuracy", score: 1, notes: null, evidence: [] },
    ],
  })
  await rejectsWithCode(
    store.completeQualityEvaluation({
      organizationId: owner.organization.id,
      evaluationId: proposal.id,
      expectedVersion: submitted.evaluation.version,
    }),
    "QUALITY_AI_PROPOSAL_NOT_FINAL"
  )

  const human = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: proposal.id,
  })
  assert.equal(human.aiProposalId, proposal.id)
})

storeTest("phase 8: findings link to traceable remediations", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const service = new QualityService(store)
  const { conversation, message } = await conversationWithMessage(store, owner.organization.id)
  const { version } = await publishedVersion(service, owner.organization.id)

  const created = await service.createEvaluation({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: null,
  })
  const assigned = await store.assignQualityEvaluation({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    reviewerMemberId: (await store.createWorkforceMember({
      organizationId: owner.organization.id,
      displayName: "Reviewer",
      userId: null,
      type: "HUMAN",
    })).id,
    expectedVersion: 1,
  })
  const inReview = await store.beginQualityReview({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: assigned.version,
  })
  const { findings } = await service.submitFindings({
    organizationId: owner.organization.id,
    evaluationId: created.id,
    expectedVersion: inReview.version,
    findings: [
      { criterionKey: "greeting", score: 0, notes: "no greeting", evidence: [{ messageId: message.id }] },
      { criterionKey: "accuracy", score: 1, notes: null, evidence: [] },
    ],
  })
  const target = findings.find((finding) => finding.criterionKey === "greeting")
  assert.ok(target)
  const remediation = await store.createQualityRemediation({
    organizationId: owner.organization.id,
    findingId: target.id,
    kind: "COACHING",
    notes: "coach greeting",
  })
  assert.equal(remediation.status, "OPEN")
  const progress = await store.setQualityRemediationStatus({
    organizationId: owner.organization.id,
    remediationId: remediation.id,
    status: "IN_PROGRESS",
  })
  assert.equal(progress.status, "IN_PROGRESS")
  const done = await store.setQualityRemediationStatus({
    organizationId: owner.organization.id,
    remediationId: remediation.id,
    status: "DONE",
  })
  assert.equal(done.status, "DONE")
  assert.ok(done.closedAt)
  await rejectsWithCode(
    store.setQualityRemediationStatus({
      organizationId: owner.organization.id,
      remediationId: remediation.id,
      status: "OPEN",
    }),
    "QUALITY_REMEDIATION_TERMINAL"
  )
})

storeTest("phase 8: cross-tenant evaluation access returns not-found", async (makeStore) => {
  const store = await makeStore()
  const first = await signup(store, "First Org", "first@example.com")
  const second = await signup(store, "Second Org", "second@example.com")
  const service = new QualityService(store)
  const { conversation } = await conversationWithMessage(store, first.organization.id)
  const { version } = await publishedVersion(service, first.organization.id)
  const created = await service.createEvaluation({
    organizationId: first.organization.id,
    conversationId: conversation.id,
    scorecardVersionId: version.id,
    sampleId: null,
    evaluatorType: "HUMAN",
    aiProposalId: null,
  })
  assert.equal(await store.getQualityEvaluation(second.organization.id, created.id), null)
  assert.deepEqual(await store.listQualityEvaluations(second.organization.id), [])
})

test("phase 8: quality HTTP API enforces authentication and tenant scope", async () => {
  const { MemoryStore } = await import("./infrastructure/store.js")
  const store = new MemoryStore()
  const first = await signup(store, "HTTP One", "http-one@example.com")
  const second = await signup(store, "HTTP Two", "http-two@example.com")

  const bearer = (token: string) => ({
    authorization: "Bearer " + token,
    "content-type": "application/json",
  })

  const anonymous = await first.app(
    new Request("http://localhost/api/v1/quality/scorecards", { headers: {} })
  )
  assert.equal(anonymous.status, 401)

  const created = await first.app(
    new Request("http://localhost/api/v1/quality/scorecards/versions", {
      method: "POST",
      headers: bearer(first.session.accessToken),
      body: JSON.stringify({ name: "Support QA", criteria: criteria() }),
    })
  )
  assert.equal(created.status, 201)
  const { version } = (await created.json()) as { version: { id: string } }

  const foreignVersions = await second.app(
    new Request("http://localhost/api/v1/quality/evaluations", {
      headers: bearer(second.session.accessToken),
    })
  )
  assert.equal(foreignVersions.status, 200)
  assert.deepEqual(((await foreignVersions.json()) as { items: unknown[] }).items, [])

  const foreignPublish = await second.app(
    new Request("http://localhost/api/v1/quality/scorecards/missing/versions/" + version.id + "/publish", {
      method: "POST",
      headers: bearer(second.session.accessToken),
    })
  )
  assert.equal(foreignPublish.status, 404)
})
