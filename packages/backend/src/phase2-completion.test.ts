import assert from "node:assert/strict"

import { ConversationPipeline, type InboundMessage } from "./application/pipeline.js"
import { createApp } from "./app.js"
import {
  MemoryStore,
  type Store,
} from "./infrastructure/store.js"
import {
  ScriptedGateway,
  storeTest,
  type MakeStore,
} from "./test-support.js"

async function world(makeStore: MakeStore) {
  const store = await makeStore()
  const provisioned = await store.provisionOrganization({
    organizationName: "Alpha",
    ownerEmail: "owner@alpha.example",
    ownerDisplayName: "Alpha Owner",
    slug: "alpha",
    idempotencyKey: null,
    sessionTtlSeconds: 3600,
  })

  await store.createKnowledgeDocument({
    organizationId: provisioned.principal.membership.organizationId,
    title: "Returns policy",
    source: "manual",
    chunks: [
      "Items can be returned within 14 days of delivery. Refunds are issued to the original payment method.",
    ],
  })

  return { store, provisioned }
}

function inbound(orgId: string, messageId: string, content: string): InboundMessage {
  return {
    organizationId: orgId,
    channel: "web",
    provider: "web",
    providerAccountId: "widget-1",
    externalCustomerId: "visitor-1",
    customerDisplayName: "Visitor",
    providerMessageId: messageId,
    content,
  }
}

test("phase 2: answered conversations emit durable message and AI-run outbox events", async () => {
  const { store, provisioned } = await world(async () => new MemoryStore())
  const gateway = new ScriptedGateway(
    () => JSON.stringify({
      can_answer: true,
      answer: "You can return items within 14 days.",
      sources: [1],
    })
  )
  const pipeline = new ConversationPipeline(store, { gateway })

  const result = await pipeline.processInbound(
    inbound(
      provisioned.principal.membership.organizationId,
      "provider-1",
      "How many days do I have to return an item?"
    )
  )

  assert.equal(result.ai?.status, "answered")

  const events = await store.listOutboxEvents(
    provisioned.principal.membership.organizationId
  )

  assert.equal(events.length, 3)
  assert.deepEqual(
    events.map((event) => event.eventType).sort(),
    [
      "ai.run.completed",
      "conversation.message.created",
      "conversation.message.created",
    ].sort()
  )
  assert.ok(events.every((event) => event.status === "PENDING"))
  assert.ok(
    events.every(
      (event) =>
        event.organizationId ===
        provisioned.principal.membership.organizationId
    )
  )

  const runEvent = events.find((event) => event.eventType === "ai.run.completed")
  assert.ok(runEvent)
  assert.equal(runEvent.aggregateType, "ai_run")
  assert.equal(runEvent.aggregateId, result.ai?.run.id)
  assert.equal(runEvent.causationId, result.inbound.message.id)
})

storeTest("phase 2: duplicate inbound events do not create duplicate outbox entries", async (makeStore) => {
  const { store, provisioned } = await world(makeStore)
  const gateway = new ScriptedGateway(
    () =>
      JSON.stringify({
        can_answer: true,
        answer: "You can return items within 14 days.",
        sources: [1],
      })
  )
  const pipeline = new ConversationPipeline(store, { gateway })
  const event = inbound(
    provisioned.principal.membership.organizationId,
    "provider-duplicate",
    "How many days do I have to return an item?"
  )

  const first = await pipeline.processInbound(event)
  const before = await store.listOutboxEvents(
    provisioned.principal.membership.organizationId
  )
  const second = await pipeline.processInbound(event)
  const after = await store.listOutboxEvents(
    provisioned.principal.membership.organizationId
  )

  assert.equal(first.inbound.duplicate, false)
  assert.equal(second.inbound.duplicate, true)
  assert.equal(after.length, before.length)
  assert.equal(gateway.calls.length, 1)
})

storeTest("phase 2: handoff produces control, handoff, message and AI trace events", async (makeStore) => {
  const { store, provisioned } = await world(makeStore)
  const gateway = new ScriptedGateway(
    () => JSON.stringify({ can_answer: true, answer: "unused", sources: [1] })
  )
  const pipeline = new ConversationPipeline(store, { gateway })

  const result = await pipeline.processInbound(
    inbound(
      provisioned.principal.membership.organizationId,
      "provider-handoff",
      "Do you sell gift vouchers?"
    )
  )

  assert.equal(result.ai?.status, "handed_off")

  const events = await store.listOutboxEvents(
    provisioned.principal.membership.organizationId
  )
  const counts = new Map<string, number>()

  for (const event of events) {
    counts.set(event.eventType, (counts.get(event.eventType) ?? 0) + 1)
    assert.equal(event.status, "PENDING")
    assert.equal(event.payload !== null, true)
  }

  assert.equal(events.length, 5)
  assert.equal(counts.get("conversation.message.created"), 2)
  assert.equal(counts.get("conversation.control.changed"), 1)
  assert.equal(counts.get("conversation.handoff.created"), 1)
  assert.equal(counts.get("ai.run.completed"), 1)
  assert.equal(gateway.calls.length, 0)
})

storeTest("phase 2: outbox is tenant isolated", async (makeStore) => {
  const store = await makeStore()
  const alpha = await store.provisionOrganization({
    organizationName: "Alpha",
    ownerEmail: "a@alpha.example",
    ownerDisplayName: "Alpha Owner",
    slug: "alpha-isolation",
    idempotencyKey: null,
    sessionTtlSeconds: 3600,
  })
  const beta = await store.provisionOrganization({
    organizationName: "Beta",
    ownerEmail: "b@beta.example",
    ownerDisplayName: "Beta Owner",
    slug: "beta-isolation",
    idempotencyKey: null,
    sessionTtlSeconds: 3600,
  })

  await store.createKnowledgeDocument({
    organizationId: alpha.principal.membership.organizationId,
    title: "Returns",
    source: "manual",
    chunks: ["Items can be returned within 14 days."],
  })

  const pipeline = new ConversationPipeline(store, {
    gateway: new ScriptedGateway(() =>
      JSON.stringify({
        can_answer: true,
        answer: "14 days.",
        sources: [1],
      })
    ),
  })

  await pipeline.processInbound(
    inbound(
      alpha.principal.membership.organizationId,
      "provider-isolation",
      "How many days can I return an item?"
    )
  )

  assert.ok(
    (await store.listOutboxEvents(alpha.principal.membership.organizationId))
      .length > 0
  )
  assert.equal(
    (await store.listOutboxEvents(beta.principal.membership.organizationId))
      .length,
    0
  )
})

storeTest("phase 2: AI run history is exposed through the authenticated API", async (makeStore) => {
  const { store, provisioned } = await world(makeStore)
  const gateway = new ScriptedGateway(
    () =>
      JSON.stringify({
        can_answer: true,
        answer: "You can return items within 14 days.",
        sources: [1],
      })
  )
  const pipeline = new ConversationPipeline(store, { gateway })

  const result = await pipeline.processInbound(
    inbound(
      provisioned.principal.membership.organizationId,
      "provider-api",
      "How many days do I have to return an item?"
    )
  )

  const handle = await createApp(store)
  const response = await handle(
    new Request(
      "http://localhost/api/v1/conversations/" +
        result.inbound.conversation.id +
        "/ai-runs",
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + provisioned.sessionToken,
        },
      }
    )
  )

  assert.equal(response.status, 200)
  const body = (await response.json()) as { items: { id: string; outcome: string }[] }
  assert.equal(body.items.length, 1)
  assert.equal(body.items[0]?.id, result.ai?.run.id)
  assert.equal(body.items[0]?.outcome, "ANSWERED")
})
