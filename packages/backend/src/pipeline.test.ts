import assert from "node:assert/strict"
import { setTimeout as sleep } from "node:timers/promises"

import { createApp } from "./app.js"
import type { Store } from "./infrastructure/store.js"
import {
  ConversationPipeline,
  type InboundMessage,
} from "./application/pipeline.js"
import { ScriptedGateway, storeTest, type MakeStore } from "./test-support.js"

type Handle = (request: Request) => Promise<Response>

function call(
  handle: Handle,
  method: string,
  path: string,
  options: { body?: unknown; token?: string; org?: string } = {}
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers["content-type"] = "application/json"
  if (options.token) headers.authorization = "Bearer " + options.token
  if (options.org) headers["x-organization-id"] = options.org

  return handle(
    new Request("http://localhost" + path, {
      method,
      headers,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    })
  )
}

interface Tenant {
  organizationId: string
  userId: string
  token: string
}

async function signup(handle: Handle, name: string, email: string): Promise<Tenant> {
  const response = await call(handle, "POST", "/api/v1/auth/signup", {
    body: { organizationName: name, email, displayName: name + " Owner" },
  })
  assert.equal(response.status, 201)
  const body = (await response.json()) as {
    organization: { id: string }
    user: { id: string }
    session: { accessToken: string }
  }
  return { organizationId: body.organization.id, userId: body.user.id, token: body.session.accessToken }
}

async function addDocument(handle: Handle, tenant: Tenant, title: string, content: string) {
  const response = await call(handle, "POST", "/api/v1/knowledge/documents", {
    token: tenant.token,
    body: { title, content },
  })
  assert.equal(response.status, 201)
  return (await response.json()) as { id: string; chunkCount: number }
}

const RETURNS =
  "Items can be returned within 14 days of delivery. Refunds are issued to the original payment method within 5 business days."
const SHIPPING = "Standard shipping takes 3 to 5 business days across Egypt."

const answer = (text = "You can return items within 14 days.", sources = [1]) =>
  JSON.stringify({ can_answer: true, answer: text, sources })

interface World {
  store: Store
  handle: Handle
  alpha: Tenant
  gateway: ScriptedGateway
  pipeline: ConversationPipeline
}

async function world(
  makeStore: MakeStore,
  respond: ConstructorParameters<typeof ScriptedGateway>[0] = () => answer(),
  options: { aiEnabled?: boolean; knowledge?: boolean } = {}
): Promise<World> {
  const store = await makeStore()
  const handle = await createApp(store)
  const alpha = await signup(handle, "Alpha", "a@alpha.example")

  if (options.knowledge !== false) {
    await addDocument(handle, alpha, "Returns policy", RETURNS)
    await addDocument(handle, alpha, "Shipping", SHIPPING)
  }

  const gateway = new ScriptedGateway(respond)
  const pipeline = new ConversationPipeline(store, {
    gateway: options.aiEnabled === false ? null : gateway,
  })

  return { store, handle, alpha, gateway, pipeline }
}

let sequence = 0
function inbound(tenant: Tenant, content: string, overrides: Partial<InboundMessage> = {}): InboundMessage {
  return {
    organizationId: tenant.organizationId,
    channel: "widget",
    provider: "widget",
    providerAccountId: "widget-1",
    externalCustomerId: "visitor-1",
    customerDisplayName: "Visitor",
    providerMessageId: "pm-" + ++sequence,
    clientMessageId: null,
    content,
    ...overrides,
  }
}

async function messagesOf(w: World, conversationId: string) {
  return w.store.listMessages(w.alpha.organizationId, conversationId, 100)
}

storeTest("the AI answers from tenant knowledge and the run is fully traceable", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received, ai } = await w.pipeline.processInbound(
    inbound(w.alpha, "How many days do I have to return an item?")
  )

  assert.equal(ai?.status, "answered")
  assert.equal(received.conversation.control, "ai")

  const messages = await messagesOf(w, received.conversation.id)
  assert.deepEqual(
    messages.map((m) => [m.direction, m.authorType]),
    [["INBOUND", "CUSTOMER"], ["OUTBOUND", "AI"]]
  )
  assert.equal(messages[1]?.content, "You can return items within 14 days.")

  const runs = await w.store.listAiRuns(w.alpha.organizationId, received.conversation.id)
  assert.equal(runs.length, 1)
  const run = runs[0]!
  assert.equal(run.outcome, "ANSWERED")
  assert.equal(run.provider, "fake")
  assert.equal(run.model, "fake-1")
  assert.equal(run.promptVersion, "support-v2-ctx1")
  assert.equal(run.inputTokens, 100)
  assert.equal(run.outputTokens, 20)
  assert.equal(run.inboundMessageId, received.message.id)
  assert.equal(run.replyMessageId, messages[1]?.id)
  assert.equal(run.retrieved[0]?.cited, true)
  assert.ok(run.retrieved[0]!.coverage >= 0.5)

  assert.equal(w.gateway.calls.length, 1)
  assert.match(w.gateway.calls[0]!.system, /Returns policy/)
  assert.doesNotMatch(w.gateway.calls[0]!.system, /Standard shipping/)
  assert.equal(w.gateway.calls[0]!.messages.at(-1)?.role, "user")
})

storeTest("no relevant knowledge hands off without calling the model", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received, ai } = await w.pipeline.processInbound(
    inbound(w.alpha, "Do you sell gift vouchers for birthdays?")
  )

  assert.equal(ai?.status, "handed_off")
  assert.equal(w.gateway.calls.length, 0)

  const conversation = await w.store.getConversation(w.alpha.organizationId, received.conversation.id)
  assert.equal(conversation?.control, "queue")

  const handoffs = await w.store.listHandoffs(w.alpha.organizationId, "OPEN")
  assert.equal(handoffs.length, 1)
  assert.equal(handoffs[0]?.reason, "NO_RELEVANT_KNOWLEDGE")
  assert.match(handoffs[0]!.summary, /gift vouchers/)

  const messages = await messagesOf(w, received.conversation.id)
  assert.equal(messages.at(-1)?.authorType, "SYSTEM")
  assert.doesNotMatch(messages.at(-1)!.content, /\p{Script=Arabic}/u)

  const run = (await w.store.listAiRuns(w.alpha.organizationId, received.conversation.id))[0]!
  assert.equal(run.outcome, "HANDOFF")
  assert.equal(run.reason, "NO_RELEVANT_KNOWLEDGE")
  assert.equal(run.provider, null)
  assert.equal(run.handoffId, handoffs[0]?.id)
})

storeTest("an Arabic customer gets an Arabic handoff notice", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received } = await w.pipeline.processInbound(inbound(w.alpha, "عندكم كروت هدايا؟"))
  const messages = await messagesOf(w, received.conversation.id)
  assert.match(messages.at(-1)!.content, /\p{Script=Arabic}/u)
})

for (const request of ["I want to talk to a human about my return", "عايز اكلم موظف"]) {
  storeTest(`an explicit request for a person hands off even when knowledge matches: ${request}`, async (makeStore) => {
    const w = await world(makeStore)
    const { ai } = await w.pipeline.processInbound(inbound(w.alpha, request))

    assert.equal(ai?.status, "handed_off")
    assert.equal(w.gateway.calls.length, 0)
    assert.equal((await w.store.listHandoffs(w.alpha.organizationId))[0]?.reason, "CUSTOMER_REQUESTED_HUMAN")
  })
}

const BAD_MODEL_OUTPUTS: [string, () => string, string][] = [
  ["not JSON", () => "Sure, 14 days!", "MODEL_OUTPUT_INVALID"],
  ["can_answer false", () => JSON.stringify({ can_answer: false, answer: "", sources: [] }), "MODEL_COULD_NOT_ANSWER"],
  ["no sources cited", () => answer("Probably 14 days.", []), "UNGROUNDED_ANSWER"],
  ["source out of range", () => answer("Probably 14 days.", [9]), "UNGROUNDED_ANSWER"],
  ["provider failure", () => { throw new Error("upstream 529") }, "PROVIDER_ERROR"],
]

for (const [label, respond, reason] of BAD_MODEL_OUTPUTS) {
  storeTest(`unusable model output never reaches the customer: ${label}`, async (makeStore) => {
    const w = await world(makeStore, respond)
    const { inbound: received, ai } = await w.pipeline.processInbound(
      inbound(w.alpha, "How many days do I have to return an item?")
    )

    assert.equal(ai?.status, "handed_off")
    const messages = await messagesOf(w, received.conversation.id)
    assert.ok(messages.every((m) => m.authorType !== "AI"))

    const run = (await w.store.listAiRuns(w.alpha.organizationId, received.conversation.id))[0]!
    assert.equal(run.reason, reason)
    assert.equal(run.provider, "fake")
    if (reason === "PROVIDER_ERROR") assert.equal(run.error, "upstream 529")
  })
}

storeTest("a late AI reply is discarded when a human takes over meanwhile", async (makeStore) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => { release = resolve })

  const w = await world(makeStore, async () => { await gate; return answer() })
  const pending = w.pipeline.processInbound(inbound(w.alpha, "How many days do I have to return an item?"))

  while (w.gateway.calls.length === 0) await sleep(5)

  const [conversation] = await w.store.listConversations(w.alpha.organizationId)
  const agent = await w.store.createWorkforceMember({
    organizationId: w.alpha.organizationId, userId: null, displayName: "Agent", type: "HUMAN",
  })
  await w.store.createAssignment({
    organizationId: w.alpha.organizationId,
    conversationId: conversation!.id,
    workforceMemberId: agent.id,
    reason: "takeover",
    expectedConversationVersion: conversation!.version,
  })

  release()
  const { ai } = await pending

  assert.equal(ai?.status, "discarded")
  const messages = await messagesOf(w, conversation!.id)
  assert.deepEqual(messages.map((m) => m.authorType), ["CUSTOMER"])

  const run = (await w.store.listAiRuns(w.alpha.organizationId, conversation!.id))[0]!
  assert.equal(run.outcome, "DISCARDED_STALE")
  assert.equal(
    (await w.store.getConversation(w.alpha.organizationId, conversation!.id))?.control,
    "human"
  )
})

storeTest("assigning a human claims the open handoff", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received } = await w.pipeline.processInbound(inbound(w.alpha, "Do you sell gift vouchers?"))
  const conversation = (await w.store.getConversation(w.alpha.organizationId, received.conversation.id))!

  const agent = await w.store.createWorkforceMember({
    organizationId: w.alpha.organizationId, userId: null, displayName: "Agent", type: "HUMAN",
  })
  await w.store.createAssignment({
    organizationId: w.alpha.organizationId,
    conversationId: conversation.id,
    workforceMemberId: agent.id,
    reason: "claim",
    expectedConversationVersion: conversation.version,
  })

  assert.equal((await w.store.listHandoffs(w.alpha.organizationId, "OPEN")).length, 0)
  assert.equal((await w.store.listHandoffs(w.alpha.organizationId, "CLAIMED")).length, 1)
})

storeTest("a duplicate provider event is stored and answered once", async (makeStore) => {
  const w = await world(makeStore)
  const event = inbound(w.alpha, "How many days do I have to return an item?", { providerMessageId: "wamid-1" })

  const first = await w.pipeline.processInbound(event)
  const second = await w.pipeline.processInbound(event)

  assert.equal(first.inbound.duplicate, false)
  assert.equal(second.inbound.duplicate, true)
  assert.equal(second.ai, null)
  assert.equal(second.inbound.message.id, first.inbound.message.id)
  assert.equal(w.gateway.calls.length, 1)
  assert.equal((await messagesOf(w, first.inbound.conversation.id)).length, 2)
})

storeTest("parallel duplicates of one provider event produce one message and one AI run", async (makeStore) => {
  const w = await world(makeStore)
  const event = inbound(w.alpha, "How many days do I have to return an item?", { providerMessageId: "wamid-par" })

  const results = await Promise.all(Array.from({ length: 5 }, () => w.pipeline.processInbound(event)))

  assert.equal(results.filter((r) => !r.inbound.duplicate).length, 1)
  assert.equal(w.gateway.calls.length, 1)

  const [conversation] = await w.store.listConversations(w.alpha.organizationId)
  assert.equal((await messagesOf(w, conversation!.id)).length, 2)
  assert.equal((await w.store.listAiRuns(w.alpha.organizationId, conversation!.id)).length, 1)
})

storeTest("running the AI step twice for one message answers once", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received } = await w.pipeline.processInbound(inbound(w.alpha, "How many days do I have to return an item?"))

  const again = await w.pipeline.respondWithAi({
    organizationId: w.alpha.organizationId,
    conversationId: received.conversation.id,
    inboundMessageId: received.message.id,
  })

  assert.deepEqual(again, { status: "skipped", reason: "ALREADY_PROCESSED" })
  assert.equal(w.gateway.calls.length, 1)
})

storeTest("concurrent first messages from a new customer create one customer and one conversation", async (makeStore) => {
  const w = await world(makeStore)

  await Promise.all(
    ["How many days to return an item?", "Return policy please", "Is return free?", "Return window?"].map((text) =>
      w.pipeline.processInbound(inbound(w.alpha, text))
    )
  )

  assert.equal((await w.store.listCustomers(w.alpha.organizationId)).length, 1)
  const conversations = await w.store.listConversations(w.alpha.organizationId)
  assert.equal(conversations.length, 1)

  const messages = await messagesOf(w, conversations[0]!.id)
  assert.equal(messages.filter((m) => m.direction === "INBOUND").length, 4)
})

storeTest("with AI disabled new conversations go straight to the human queue", async (makeStore) => {
  const w = await world(makeStore, () => answer(), { aiEnabled: false })
  const { inbound: received, ai } = await w.pipeline.processInbound(inbound(w.alpha, "How many days to return an item?"))

  assert.deepEqual(ai, { status: "skipped", reason: "AI_DISABLED" })
  assert.equal(received.conversation.control, "queue")
  assert.equal((await w.store.listAiRuns(w.alpha.organizationId, received.conversation.id)).length, 0)
  assert.equal(w.gateway.calls.length, 0)
})

storeTest("replies after a handoff stay with humans: the AI does not answer a queued conversation", async (makeStore) => {
  const w = await world(makeStore)
  await w.pipeline.processInbound(inbound(w.alpha, "Do you sell gift vouchers?"))
  const followUp = await w.pipeline.processInbound(inbound(w.alpha, "How many days do I have to return an item?"))

  assert.deepEqual(followUp.ai, { status: "skipped", reason: "NOT_AI_CONTROLLED" })
  assert.equal(w.gateway.calls.length, 0)
})

storeTest("knowledge is tenant-scoped, role-gated and archivable", async (makeStore) => {
  const w = await world(makeStore)
  const beta = await signup(w.handle, "Beta", "b@beta.example")

  const list = async (tenant: Tenant, org?: string) =>
    (await (await call(w.handle, "GET", "/api/v1/knowledge/documents", { token: tenant.token, ...(org ? { org } : {}) })).json()) as { items: { id: string; status: string }[] }

  const alphaDocs = await list(w.alpha)
  assert.equal(alphaDocs.items.length, 2)
  assert.equal((await list(beta)).items.length, 0)

  // Beta's pipeline never sees Alpha's knowledge.
  const betaPipeline = new ConversationPipeline(w.store, { gateway: w.gateway })
  const betaResult = await betaPipeline.processInbound(inbound(beta, "How many days do I have to return an item?"))
  assert.equal(betaResult.ai?.status, "handed_off")
  assert.equal(w.gateway.calls.length, 0)

  const foreignArchive = await call(w.handle, "POST", `/api/v1/knowledge/documents/${alphaDocs.items[0]!.id}/archive`, { token: beta.token })
  assert.equal(foreignArchive.status, 404)

  // An AGENT may read but not manage knowledge.
  await w.store.createMembership({ userId: w.alpha.userId, organizationId: beta.organizationId, role: "AGENT" })
  assert.equal((await call(w.handle, "GET", "/api/v1/knowledge/documents", { token: w.alpha.token, org: beta.organizationId })).status, 200)
  assert.equal(
    (await call(w.handle, "POST", "/api/v1/knowledge/documents", { token: w.alpha.token, org: beta.organizationId, body: { title: "x1", content: "y" } })).status,
    403
  )

  // Alpha's owner now belongs to two organizations, so the header is required.
  assert.equal((await call(w.handle, "GET", "/api/v1/knowledge/documents", { token: w.alpha.token })).status, 400)

  // Archiving removes a document from retrieval.
  for (const doc of alphaDocs.items) {
    assert.equal(
      (await call(w.handle, "POST", `/api/v1/knowledge/documents/${doc.id}/archive`, { token: w.alpha.token, org: w.alpha.organizationId })).status,
      200
    )
  }
  assert.ok((await list(w.alpha, w.alpha.organizationId)).items.every((doc) => doc.status === "ARCHIVED"))
  const after = await w.pipeline.processInbound(inbound(w.alpha, "How many days do I have to return an item?"))
  assert.equal(after.ai?.status, "handed_off")
  assert.equal(w.gateway.calls.length, 0)
})

storeTest("message and handoff endpoints are tenant-scoped and validated", async (makeStore) => {
  const w = await world(makeStore)
  const beta = await signup(w.handle, "Beta", "b@beta.example")
  const { inbound: received } = await w.pipeline.processInbound(inbound(w.alpha, "Do you sell gift vouchers?"))

  const messages = (await (await call(w.handle, "GET", `/api/v1/conversations/${received.conversation.id}/messages`, { token: w.alpha.token })).json()) as { items: { authorType: string }[] }
  assert.deepEqual(messages.items.map((m) => m.authorType), ["CUSTOMER", "SYSTEM"])

  assert.equal((await call(w.handle, "GET", `/api/v1/conversations/${received.conversation.id}/messages`, { token: beta.token })).status, 404)

  const open = (await (await call(w.handle, "GET", "/api/v1/handoffs?status=OPEN", { token: w.alpha.token })).json()) as { items: unknown[] }
  assert.equal(open.items.length, 1)
  const betaOpen = (await (await call(w.handle, "GET", "/api/v1/handoffs", { token: beta.token })).json()) as { items: unknown[] }
  assert.equal(betaOpen.items.length, 0)
  assert.equal((await call(w.handle, "GET", "/api/v1/handoffs?status=NOPE", { token: w.alpha.token })).status, 400)
})

storeTest("human replies deduplicate on clientMessageId", async (makeStore) => {
  const w = await world(makeStore)
  const { inbound: received } = await w.pipeline.processInbound(inbound(w.alpha, "Do you sell gift vouchers?"))
  const send = () =>
    call(w.handle, "POST", `/api/v1/conversations/${received.conversation.id}/messages`, {
      token: w.alpha.token,
      body: { content: "Let me check that for you.", clientMessageId: "c-1" },
    })

  const first = await send()
  const second = await send()
  assert.equal(first.status, 202)
  assert.equal(second.status, 200)
  assert.equal(((await first.json()) as { id: string }).id, ((await second.json()) as { id: string }).id)
})

storeTest("the relevance threshold, not just an empty match, gates the model call", async (makeStore) => {
  const w = await world(makeStore)
  // "shipping refund" matches one chunk on each term: coverage 0.5 per chunk.
  const question = "shipping refund"

  const lenient = await w.pipeline.processInbound(inbound(w.alpha, question))
  assert.equal(lenient.ai?.status, "answered")
  assert.equal(w.gateway.calls.length, 1)

  const strict = new ConversationPipeline(w.store, { gateway: w.gateway, minCoverage: 0.6 })
  const gated = await strict.processInbound(inbound(w.alpha, question))
  assert.equal(gated.ai?.status, "handed_off")
  assert.equal(w.gateway.calls.length, 1, "model must not be called below the threshold")

  const run = (await w.store.listAiRuns(w.alpha.organizationId, gated.inbound.conversation.id)).at(-1)!
  assert.equal(run.reason, "NO_RELEVANT_KNOWLEDGE")
  assert.ok(run.retrieved.length > 0 && run.retrieved.every((r) => r.coverage < 0.6))
})
