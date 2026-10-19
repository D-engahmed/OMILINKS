import assert from "node:assert/strict"
import { test } from "node:test"

import type { Store } from "./infrastructure/store.js"
import { createApp } from "./app.js"
import { storeTest } from "./test-support.js"

async function signup(store: Store, name = "Inbox Org", email = "inbox@example.com") {
  const app = await createApp(store)
  const response = await app(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: name,
        email,
        displayName: "Inbox Owner",
      }),
    })
  )
  assert.equal(response.status, 201)
  return {
    app,
    ...(await response.json()) as {
      organization: { id: string }
      user: { id: string }
      membership: { role: string }
      session: { accessToken: string }
    },
  }
}

async function seededConversation(store: Store, organizationId: string, externalId: string, control: "ai" | "queue" = "queue") {
  const customer = await store.createCustomer({
    organizationId,
    displayName: "Customer " + externalId,
    provider: "widget",
    providerAccountId: "acct",
    externalId,
  })
  const conversation = await store.createConversation({
    organizationId,
    customerId: customer.id,
    channel: "widget",
    control,
  })
  const { message } = await store.appendMessage({
    organizationId,
    conversationId: conversation.id,
    direction: "INBOUND",
    authorType: "CUSTOMER",
    content: "Hello from " + externalId,
  })
  return { customer, conversation, message }
}

storeTest("inbox: rows enrich conversation with customer, message, assignment, and handoff", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const org = owner.organization.id
  const { conversation, message } = await seededConversation(store, org, "v1")

  let rows = await store.getInboxView({
    organizationId: org,
    statuses: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"],
    controls: ["human", "ai", "queue"],
    assigned: "any",
    limit: 50,
  })
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.conversation.id, conversation.id)
  assert.equal(rows[0]?.customer.displayName, "Customer v1")
  assert.equal(rows[0]?.lastMessage?.id, message.id)
  assert.equal(rows[0]?.activeAssignment, null)
  assert.equal(rows[0]?.openHandoff, null)

  const member = await store.createWorkforceMember({
    organizationId: org,
    displayName: "Agent",
    userId: null,
    type: "HUMAN",
  })
  await store.createAssignment({
    organizationId: org,
    conversationId: conversation.id,
    workforceMemberId: member.id,
    reason: "manual",
    expectedConversationVersion: 1,
  })

  rows = await store.getInboxView({
    organizationId: org,
    statuses: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"],
    controls: ["human", "ai", "queue"],
    assigned: "assigned",
    limit: 50,
  })
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.activeAssignment?.workforceMemberId, member.id)
  assert.equal(rows[0]?.assignee?.displayName, "Agent")
  assert.equal(rows[0]?.conversation.control, "human")

  const unassigned = await store.getInboxView({
    organizationId: org,
    statuses: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"],
    controls: ["human", "ai", "queue"],
    assigned: "unassigned",
    limit: 50,
  })
  assert.equal(unassigned.length, 0)
})

storeTest("inbox: filters narrow by status and control", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const org = owner.organization.id
  await seededConversation(store, org, "v1")
  await seededConversation(store, org, "v2")

  const queueOnly = await store.getInboxView({
    organizationId: org,
    statuses: ["OPEN"],
    controls: ["queue"],
    assigned: "any",
    limit: 50,
  })
  assert.equal(queueOnly.length, 2)

  const empty = await store.getInboxView({
    organizationId: org,
    statuses: ["RESOLVED"],
    controls: ["human", "ai", "queue"],
    assigned: "any",
    limit: 50,
  })
  assert.equal(empty.length, 0)
})

storeTest("inbox: handoffs can be scoped to one conversation", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(store)
  const org = owner.organization.id
  const first = await seededConversation(store, org, "v1", "ai")
  const second = await seededConversation(store, org, "v2", "ai")

  for (const item of [first, second]) {
    await store.escalateToQueue({
      organizationId: org,
      conversationId: item.conversation.id,
      expectedControlVersion: 1,
      reason: "NO_RELEVANT_KNOWLEDGE",
      summary: "needs human",
      notice: "handover",
      run: {
        organizationId: org,
        conversationId: item.conversation.id,
        inboundMessageId: item.message.id,
        provider: null,
        model: null,
        promptVersion: "t",
        retrieved: [],
        inputTokens: null,
        outputTokens: null,
        latencyMs: null,
        outcome: "HANDOFF",
        reason: "NO_RELEVANT_KNOWLEDGE",
        error: null,
      },
    })
  }

  const scoped = await store.listHandoffs(org, "OPEN", first.conversation.id)
  assert.equal(scoped.length, 1)
  assert.equal(scoped[0]?.conversationId, first.conversation.id)

  const rows = await store.getInboxView({
    organizationId: org,
    statuses: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"],
    controls: ["human", "ai", "queue"],
    assigned: "any",
    limit: 50,
  })
  assert.equal(rows.length, 2)
  assert.ok(rows.every((row) => row.openHandoff?.status === "OPEN"))
})

storeTest("inbox: tenant isolation holds for rows and handoffs", async (makeStore) => {
  const store = await makeStore()
  const first = await signup(store, "First Org", "first@example.com")
  const second = await signup(store, "Second Org", "second@example.com")
  await seededConversation(store, first.organization.id, "v1")

  const foreign = await store.getInboxView({
    organizationId: second.organization.id,
    statuses: ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"],
    controls: ["human", "ai", "queue"],
    assigned: "any",
    limit: 50,
  })
  assert.deepEqual(foreign, [])
  assert.deepEqual(await store.listHandoffs(second.organization.id, undefined), [])
})

test("inbox: HTTP API requires auth and validates filters", async () => {
  const { MemoryStore } = await import("./infrastructure/store.js")
  const store = new MemoryStore()
  const owner = await signup(store)
  const bearer = {
    authorization: "Bearer " + owner.session.accessToken,
    "content-type": "application/json",
  }

  const anonymous = await owner.app(new Request("http://localhost/api/v1/inbox"))
  assert.equal(anonymous.status, 401)

  const ok = await owner.app(
    new Request("http://localhost/api/v1/inbox?assigned=unassigned&limit=10", { headers: bearer })
  )
  assert.equal(ok.status, 200)
  assert.deepEqual(((await ok.json()) as { items: unknown[] }).items, [])

  const badStatus = await owner.app(
    new Request("http://localhost/api/v1/inbox?status=BOGUS", { headers: bearer })
  )
  assert.equal(badStatus.status, 400)

  const badConversation = await owner.app(
    new Request("http://localhost/api/v1/handoffs?conversationId=nope", { headers: bearer })
  )
  assert.equal(badConversation.status, 400)
})
