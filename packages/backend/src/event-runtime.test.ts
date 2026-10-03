import assert from "node:assert/strict"
import { createApp } from "./app.js"
import { WorkerRuntime } from "./infrastructure/event-runtime.js"
import { createDefaultEventConsumers } from "./infrastructure/event-consumers.js"
import type { EventConsumer } from "./infrastructure/event-runtime.js"
import type { Store } from "./infrastructure/store.js"
import { storeTest } from "./test-support.js"

async function signup(store: Store, name: string, email: string) {
  const handle = await createApp(store)
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

async function createConversation(store: Store, token: string) {
  const handle = await createApp(store)
  const customerResponse = await handle(
    new Request("http://localhost/api/v1/customers", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({
        displayName: "Runtime Customer",
        externalIdentity: {
          provider: "widget",
          channelAccountId: "runtime",
          externalId: crypto.randomUUID(),
        },
      }),
    })
  )
  assert.equal(customerResponse.status, 201)
  const customer = (await customerResponse.json()) as { customer: { id: string } }
  const response = await handle(
    new Request("http://localhost/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + token },
      body: JSON.stringify({ customerId: customer.customer.id, channel: "widget" }),
    })
  )
  assert.equal(response.status, 201)
  return (await response.json()) as { id: string; version: number }
}

function retryConsumer(counter: { value: number }): EventConsumer {
  return {
    consumerId: "test-consumer",
    workerClass: "test",
    eventTypes: ["conversation.message.received"],
    concurrency: 2,
    leaseSeconds: 30,
    maxAttempts: 3,
    retryBackoffSeconds: () => 0,
    handle: async () => {
      counter.value += 1
      if (counter.value < 3) throw new Error("EXPECTED_TEST_FAILURE")
    },
  }
}

storeTest("phase 5: outbox publishing is idempotent and fans out to one inbox row", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store, "Outbox", "outbox@runtime.example")
  const createdConversation = await createConversation(store, owner.session.accessToken)
  await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: createdConversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "hello",
    provider: "widget",
    providerAccountId: "runtime",
    providerMessageId: crypto.randomUUID(),
  })

  const subscription = {
    consumerId: "test-consumer",
    workerClass: "test",
    eventTypes: ["conversation.message.received"],
  }

  const first = await store.publishOutboxBatch({
    organizationId: owner.organization.id,
    publisherId: "publisher-1",
    subscriptions: [subscription],
    limit: 100,
  })
  assert.ok(first.some((event) => event.eventType === "conversation.message.received"))

  const second = await store.publishOutboxBatch({
    organizationId: owner.organization.id,
    publisherId: "publisher-2",
    subscriptions: [subscription],
    limit: 100,
  })
  assert.equal(second.length, 0)

  const claimed = await store.claimEventInboxBatch({
    organizationId: owner.organization.id,
    consumerId: "test-consumer",
    workerId: "worker-1",
    limit: 10,
    leaseSeconds: 30,
    maxAttempts: 3,
  })
  const messageEvent = claimed.find(
    (event) => event.eventType === "conversation.message.received"
  )
  assert.ok(messageEvent)
  assert.equal(messageEvent?.status, "PROCESSING")
  await store.completeEventInbox(owner.organization.id, messageEvent!.id, "worker-1")

  const none = await store.claimEventInboxBatch({
    organizationId: owner.organization.id,
    consumerId: "test-consumer",
    workerId: "worker-2",
    limit: 10,
    leaseSeconds: 30,
    maxAttempts: 3,
  })
  assert.equal(none.length, 0)
  assert.equal(createdConversation.id.length, 36)
})

storeTest("phase 5: retries reach dead letter and replay resets delivery state", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store, "Retry", "retry@runtime.example")
  const conversation = await createConversation(store, owner.session.accessToken)

  await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "retry",
    provider: "widget",
    providerAccountId: "runtime",
    providerMessageId: crypto.randomUUID(),
  })

  await store.publishOutboxBatch({
    organizationId: owner.organization.id,
    publisherId: "publisher",
    subscriptions: [{
      consumerId: "retry-consumer",
      workerClass: "test",
      eventTypes: ["conversation.message.received"],
    }],
    limit: 100,
  })

  let inboxId: string | null = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const claimed = await store.claimEventInboxBatch({
      organizationId: owner.organization.id,
      consumerId: "retry-consumer",
      workerId: "retry-worker",
      limit: 1,
      leaseSeconds: 30,
      maxAttempts: 3,
    })
    assert.equal(claimed.length, 1)
    inboxId = claimed[0]!.id
    const failed = await store.failEventInbox({
      organizationId: owner.organization.id,
      inboxId,
      workerId: "retry-worker",
      error: "boom-" + attempt,
      retryDelaySeconds: 0,
      maxAttempts: 3,
    })
    if (attempt < 3) assert.equal(failed.status, "PENDING")
    else assert.equal(failed.status, "DEAD")
  }

  const replayed = await store.replayDeadEventInbox({
    organizationId: owner.organization.id,
    inboxId: inboxId!,
  })
  assert.equal(replayed.status, "PENDING")
  assert.equal(replayed.attempts, 0)

  const reclaimed = await store.claimEventInboxBatch({
    organizationId: owner.organization.id,
    consumerId: "retry-consumer",
    workerId: "replay-worker",
    limit: 1,
    leaseSeconds: 30,
    maxAttempts: 3,
  })
  assert.equal(reclaimed.length, 1)
  await store.completeEventInbox(
    owner.organization.id,
    reclaimed[0]!.id,
    "replay-worker"
  )
})

storeTest("phase 5: worker leases prevent active ownership from being stolen", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store, "Lease", "lease@runtime.example")
  const lease = await store.acquireWorkerLease({
    workerId: "shared-worker",
    workerClass: "routing",
    leaseSeconds: 60,
    metadata: { organizationId: owner.organization.id },
  })
  assert.equal(lease.workerId, "shared-worker")
  await assert.rejects(
    store.acquireWorkerLease({
      workerId: "shared-worker",
      workerClass: "routing",
      leaseSeconds: 60,
      metadata: { attempt: 2 },
    }),
    /WORKER_LEASE_HELD/
  )
  await store.releaseWorkerLease("shared-worker")
  const reacquired = await store.acquireWorkerLease({
    workerId: "shared-worker",
    workerClass: "routing",
    leaseSeconds: 60,
    metadata: { attempt: 3 },
  })
  assert.equal(reacquired.workerId, "shared-worker")
  assert.deepEqual(reacquired.metadata, { attempt: 3 })
})
storeTest("phase 5: generic worker runtime retries a failed handler and then succeeds", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store, "Runtime", "runtime@runtime.example")
  const conversation = await createConversation(store, owner.session.accessToken)
  await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "runtime",
    provider: "widget",
    providerAccountId: "runtime",
    providerMessageId: crypto.randomUUID(),
  })
  const counter = { value: 0 }
  const runtime = new WorkerRuntime(store, [retryConsumer(counter)])

  const first = await runtime.runOnce()
  assert.equal(first.retried, 1)
  assert.equal(counter.value, 1)
  const second = await runtime.runOnce()
  assert.equal(second.retried, 1)
  assert.equal(counter.value, 2)
  const third = await runtime.runOnce()
  assert.equal(third.processed, 1)
  assert.equal(counter.value, 3)
  await runtime.stop()
})

storeTest("phase 5: routing worker drains a queue-controlled conversation", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store, "Drain", "drain@runtime.example")
  const member = await store.createWorkforceMember({
    organizationId: owner.organization.id,
    userId: owner.user.id,
    displayName: "Queue Agent",
    type: "HUMAN",
  })
  const skill = await store.createWorkforceSkill({
    organizationId: owner.organization.id,
    code: "billing",
    name: "Billing",
  })
  await store.setMemberSkills({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    skills: [{ skillId: skill.id, proficiency: 95 }],
  })
  await store.setWorkforcePresence({
    organizationId: owner.organization.id,
    workforceMemberId: member.id,
    state: "AVAILABLE",
    source: "test",
    ttlSeconds: 300,
    expectedVersion: null,
  })

  const queue = await store.createQueue({
    organizationId: owner.organization.id,
    name: "General",
    requiredSkillIds: [skill.id],
  })
  const conversation = await createConversation(store, owner.session.accessToken)
  await store.enqueueConversation({
    organizationId: owner.organization.id,
    queueId: queue.id,
    conversationId: conversation.id,
  })
  const runtime = new WorkerRuntime(store, createDefaultEventConsumers(store))
  const result = await runtime.runOnce()
  assert.ok(result.published >= 1)
  assert.ok(result.processed >= 1)

  const updated = await store.getConversation(owner.organization.id, conversation.id)
  assert.equal(updated?.control, "human")
  assert.equal(updated?.status, "ASSIGNED")
  await runtime.stop()
})
