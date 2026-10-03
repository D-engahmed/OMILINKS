import assert from "node:assert/strict"
import test from "node:test"

import { evaluateRouting } from "./domain/routing.js"
import type {
  RoutingContext,
  RoutingEvaluationCandidate,
  RoutingPolicyConfig,
  WorkforceMember,
} from "./domain/types.js"
import { RoutingService } from "./application/routing.js"
import { createApp } from "./app.js"
import { storeTest } from "./test-support.js"

const context: RoutingContext = {
  organizationId: "00000000-0000-0000-0000-000000000001",
  conversationId: "00000000-0000-0000-0000-000000000002",
  channel: "widget",
  priority: "HIGH",
  requiredSkills: ["billing"],
  teamId: null,
  requestedWorkerTypes: ["HUMAN"],
  now: "2026-10-03T09:00:00.000Z",
}

const policy: RoutingPolicyConfig = {
  allowedWorkerTypes: ["HUMAN"],
  presenceTtlSeconds: 90,
  weights: {
    skill: 100,
    proficiency: 30,
    load: 50,
    urgency: 10,
  },
  defaultQueueId: null,
}

function worker(id: string): WorkforceMember {
  return {
    id,
    organizationId: context.organizationId,
    userId: "00000000-0000-0000-0000-000000000010",
    displayName: id,
    type: "HUMAN",
    status: "ACTIVE",
    createdAt: context.now,
    updatedAt: context.now,
  }
}

function candidate(
  id: string,
  activeWork: number,
  proficiency = 80
): RoutingEvaluationCandidate {
  return {
    workforceMember: worker(id),
    skills: [{ code: "billing", proficiency }],
    presence: {
      workforceMemberId: id,
      organizationId: context.organizationId,
      state: "AVAILABLE",
      observedAt: context.now,
      expiresAt: "2026-10-03T09:05:00.000Z",
      source: "test",
      version: 1,
    },
    capacity: {
      workforceMemberId: id,
      organizationId: context.organizationId,
      maxConcurrentWork: 5,
      reservedWork: 0,
      activeWork,
      effectiveCapacity: 5 - activeWork,
      updatedAt: context.now,
      version: 1,
    },
    authorized: true,
    teamIds: [],
  }
}

test("routing engine is deterministic and prefers lower load", () => {
  const result = evaluateRouting(context, policy, [
    candidate("00000000-0000-0000-0000-000000000011", 4),
    candidate("00000000-0000-0000-0000-000000000012", 1),
  ])

  assert.equal(result.outcome, "ASSIGNED")
  assert.equal(
    result.selectedMemberId,
    "00000000-0000-0000-0000-000000000012"
  )
  assert.deepEqual(result.candidates.map((row) => row.eligible), [true, true])
})

test("routing engine uses worker id as deterministic tie-break", () => {
  const result = evaluateRouting(context, policy, [
    candidate("00000000-0000-0000-0000-000000000012", 1),
    candidate("00000000-0000-0000-0000-000000000011", 1),
  ])

  assert.equal(
    result.selectedMemberId,
    "00000000-0000-0000-0000-000000000011"
  )
})

test("routing engine hard-filters missing skills", () => {
  const missing = candidate("00000000-0000-0000-0000-000000000011", 0)
  missing.skills = []

  const result = evaluateRouting(context, policy, [missing])

  assert.equal(result.outcome, "NO_MATCH")
  assert.equal(result.candidates[0]?.rejectionCode, "MISSING_REQUIRED_SKILL")
})

test("routing engine hard-filters stale presence", () => {
  const stale = candidate("00000000-0000-0000-0000-000000000011", 0)
  stale.presence = {
    ...stale.presence!,
    expiresAt: "2026-10-03T08:59:00.000Z",
  }

  const result = evaluateRouting(context, policy, [stale])

  assert.equal(result.outcome, "NO_MATCH")
  assert.equal(result.candidates[0]?.rejectionCode, "PRESENCE_NOT_AVAILABLE")
})

test("routing engine queues when no worker is eligible and a queue is configured", () => {
  const configured = { ...policy, defaultQueueId: "queue-1" }
  const result = evaluateRouting(context, configured, [
    {
      ...candidate("00000000-0000-0000-0000-000000000011", 5),
      capacity: {
        ...candidate("00000000-0000-0000-0000-000000000011", 5).capacity,
        effectiveCapacity: 0,
      },
    },
  ])

  assert.equal(result.outcome, "QUEUED")
  assert.equal(result.queueId, "queue-1")
})

async function signup(
  handle: (request: Request) => Promise<Response>,
  name: string,
  email: string
) {
  const response = await handle(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: name,
        email,
        displayName: name + " Owner",
      }),
    })
  )
  assert.equal(response.status, 201)
  return (await response.json()) as {
    organization: { id: string }
    user: { id: string }
    session: { accessToken: string }
  }
}

async function createConversation(
  handle: (request: Request) => Promise<Response>,
  token: string
) {
  const customer = await handle(
    new Request("http://localhost/api/v1/customers", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        displayName: "Customer",
        externalIdentity: {
          provider: "widget",
          channelAccountId: "site",
          externalId: crypto.randomUUID(),
        },
      }),
    })
  )
  assert.equal(customer.status, 201)
  const customerBody = (await customer.json()) as {
    customer: { id: string }
  }

  const response = await handle(
    new Request("http://localhost/api/v1/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        customerId: customerBody.customer.id,
        channel: "widget",
      }),
    })
  )
  assert.equal(response.status, 201)
  return (await response.json()) as {
    id: string
    version: number
  }
}

storeTest("phase 4: routes to an available worker with required skill", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "routing@alpha.example")
  const skill = await store.createWorkforceSkill({
    organizationId: owner.organization.id,
    code: "billing",
    name: "Billing",
  })
  const member = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Billing Agent",
    type: "HUMAN",
  })
  await store.setMemberSkills({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    skills: [{ skillId: skill.id, proficiency: 90 }],
  })
  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "AVAILABLE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })

  const conversation = await createConversation(handle, owner.session.accessToken)
  const result = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: conversation.id,
      requiredSkills: ["billing"],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "required skill",
      commit: true,
    }
  )

  assert.equal(result.decision.outcome, "ASSIGNED")
  assert.equal(result.assignment?.workforceMemberId, member.id)
  assert.equal(result.candidates.length, 1)
  assert.equal(result.candidates[0]?.eligible, true)

  const updated = await store.getConversation(owner.organization.id, conversation.id)
  assert.equal(updated?.status, "ASSIGNED")
  assert.equal(updated?.control, "human")
})

storeTest("phase 4: no eligible worker becomes durable queue work", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Beta", "routing@beta.example")
  const queue = await store.createQueue({
    organizationId: owner.organization.id,
    name: "General",
    requiredSkillIds: [],
  })
  await store.createOrPublishRoutingPolicy({
    organizationId: owner.organization.id,
    name: "queue-policy",
    config: { ...policy, defaultQueueId: queue.id },
  })

  const member = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Offline Agent",
    type: "HUMAN",
  })
  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "OFFLINE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })

  const conversation = await createConversation(handle, owner.session.accessToken)
  const result = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: conversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "queue-policy",
      reason: "offline",
      commit: true,
    }
  )

  assert.equal(result.decision.outcome, "QUEUED")
  assert.ok(result.queueItem)

  const updated = await store.getConversation(owner.organization.id, conversation.id)
  assert.equal(updated?.control, "queue")
  assert.equal(updated?.status, "OPEN")
})

storeTest("phase 4: capacity is consumed by assignment and restored by release", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Gamma", "capacity@gamma.example")
  const member = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Single Slot",
    type: "HUMAN",
  })
  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "AVAILABLE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })
  await store.setWorkforceCapacity({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    maxConcurrentWork: 1,
    expectedVersion: 1,
  })

  const firstConversation = await createConversation(handle, owner.session.accessToken)
  const first = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: firstConversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "first",
      commit: true,
    }
  )
  assert.ok(first.assignment)

  const secondConversation = await createConversation(handle, owner.session.accessToken)
  const secondPreview = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: secondConversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "second",
      commit: false,
    }
  )
  assert.equal(secondPreview.decision.outcome, "QUEUED")

  const released = await store.releaseAssignment({
    organizationId: owner.organization.id,
    assignmentId: first.assignment!.id,
    expectedVersion: 1,
    status: "RELEASED",
  })
  assert.equal(released.status, "RELEASED")

  const third = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: secondConversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "retry after release",
      commit: true,
    }
  )
  assert.ok(third.assignment)
  assert.equal(third.assignment?.workforceMemberId, member.id)
})

storeTest("phase 4: policy publishing creates immutable versions", async (makeStore) => {
  const store = await makeStore()
  const owner = await (async () => {
    const local = await createApp(store)
    return signup(local, "Delta", "policy@delta.example")
  })()

  const v1 = await store.createOrPublishRoutingPolicy({
    organizationId: owner.organization.id,
    name: "default",
    config: policy,
  })
  const v2 = await store.createOrPublishRoutingPolicy({
    organizationId: owner.organization.id,
    name: "default",
    config: {
      ...policy,
      weights: { ...policy.weights, load: 100 },
    },
  })

  assert.equal(v1.version.version, 1)
  assert.equal(v2.version.version, 2)
  assert.equal(v1.version.status, "PUBLISHED")
  assert.equal(v2.version.status, "PUBLISHED")

  const versions = await store.listRoutingPolicies(owner.organization.id)
  const stored = versions.find((value) => value.name === "default")!
  assert.equal(stored.versions[0]?.status, "RETIRED")
  assert.equal(stored.versions[1]?.status, "PUBLISHED")

  const published = await store.getPublishedRoutingPolicy(
    owner.organization.id,
    "default"
  )
  assert.equal(published?.version.version, 2)
  assert.equal(published?.version.config.weights.load, 100)
})

storeTest("phase 4: stale routing commit is rejected after worker state changes", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Epsilon", "stale@epsilon.example")
  const member = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Stale Candidate",
    type: "HUMAN",
  })
  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "AVAILABLE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })

  const conversation = await createConversation(handle, owner.session.accessToken)
  const preview = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: conversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "preview",
      commit: false,
    }
  )
  assert.equal(preview.decision.outcome, "ASSIGNED")
  assert.equal(preview.assignment, undefined)

  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "OFFLINE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: 2,
  })

  await assert.rejects(
    store.commitRoutingAssignment({
      organizationId: owner.organization.id,
      conversationId: conversation.id,
      workforceMemberId: member.id,
      routingDecisionId: preview.decision.id,
      expectedConversationVersion: conversation.version,
      requiredSkills: [],
      teamId: null,
      presenceTtlSeconds: 90,
      reason: "stale commit",
    }),
    /WORKER_NOT_ELIGIBLE/
  )
})

storeTest("phase 4: routing decision records explain why candidates were rejected", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Zeta", "explain@zeta.example")

  const good = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Eligible",
    type: "HUMAN",
  })
  const bad = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Offline",
    type: "HUMAN",
  })

  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: good.id,
    state: "AVAILABLE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })

  const conversation = await createConversation(handle, owner.session.accessToken)
  const result = await new RoutingService(store).routeConversation(
    owner.organization.id,
    {
      conversationId: conversation.id,
      requiredSkills: [],
      teamId: null,
      requestedWorkerTypes: ["HUMAN"],
      policyName: "default",
      reason: "explain",
      commit: false,
    }
  )

  assert.equal(result.decision.outcome, "ASSIGNED")
  const badCandidate = result.candidates.find(
    (candidate) => candidate.workforceMemberId === bad.id
  )
  assert.equal(badCandidate?.eligible, false)
  assert.equal(badCandidate?.rejectionCode, "PRESENCE_NOT_AVAILABLE")
  assert.equal(result.decision.contextSnapshot.policy !== undefined, true)
})
