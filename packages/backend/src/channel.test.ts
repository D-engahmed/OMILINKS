import assert from "node:assert/strict"

import { createApp } from "./app.js"
import { storeTest } from "./test-support.js"

type Handle = (request: Request) => Promise<Response>

async function call(
  handle: Handle,
  method: string,
  path: string,
  options: {
    body?: unknown
    token?: string
    origin?: string
    widgetMessageId?: string
  } = {}
): Promise<Response> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers["content-type"] = "application/json"
  if (options.token) headers.authorization = "Bearer " + options.token
  if (options.origin) headers.origin = options.origin
  if (options.widgetMessageId) headers["x-widget-message-id"] = options.widgetMessageId

  return handle(
    new Request("http://localhost" + path, {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    })
  )
}

async function signup(handle: Handle, name: string, email: string) {
  const response = await call(handle, "POST", "/api/v1/auth/signup", {
    body: {
      organizationName: name,
      email,
      displayName: name + " Owner",
    },
  })

  assert.equal(response.status, 201)

  return (await response.json()) as {
    organization: { id: string }
    session: { accessToken: string }
  }
}

async function createWidget(
  handle: Handle,
  token: string,
  providerAccountId = "site-1"
) {
  const response = await call(handle, "POST", "/api/v1/channels", {
    token,
    body: {
      provider: "widget",
      providerAccountId,
      displayName: "Website chat",
      allowedOrigins: ["https://shop.example"],
    },
  })

  assert.equal(response.status, 201)

  return (await response.json()) as {
    id: string
    organizationId: string
    provider: string
    publicKey: string
    capabilities: Record<string, boolean>
  }
}

storeTest("phase 3: tenant can create and inspect a widget integration", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  assert.equal(integration.organizationId, owner.organization.id)
  assert.equal(integration.provider, "widget")
  assert.match(integration.publicKey, /^wk_[A-Za-z0-9_-]+$/)
  assert.equal(integration.capabilities.inbound_text, true)
  assert.equal(integration.capabilities.outbound_text, true)

  const listed = await call(handle, "GET", "/api/v1/channels", {
    token: owner.session.accessToken,
  })
  assert.equal(listed.status, 200)

  const body = (await listed.json()) as { items: { id: string }[] }
  assert.equal(body.items.length, 1)
  assert.equal(body.items[0]?.id, integration.id)
})

storeTest("phase 3: public widget config reveals no tenant identity", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const response = await call(
    handle,
    "GET",
    "/public/v1/widget/" + integration.publicKey + "/config"
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("access-control-allow-origin"), "*")

  const body = (await response.json()) as Record<string, unknown>
  assert.equal(body.provider, "widget")
  assert.equal(body.publicKey, integration.publicKey)
  assert.equal("organizationId" in body, false)
})

storeTest("phase 3: widget ingress binds tenant from integration and persists canonical message", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const response = await call(
    handle,
    "POST",
    "/public/v1/widget/" + integration.publicKey + "/messages",
    {
      origin: "https://shop.example",
      widgetMessageId: "widget-event-001",
      body: {
        visitorId: "visitor-42",
        customerDisplayName: "Alice",
        content: "Hello from the website",
      },
    }
  )

  assert.equal(response.status, 202)
  assert.equal(response.headers.get("x-request-id") !== null, true)

  const body = (await response.json()) as {
    accepted: boolean
    duplicate: boolean
    inFlight: boolean
    eventId: string
    messageId: string | null
    conversationId: string | null
    customerId: string | null
  }

  assert.equal(body.accepted, true)
  assert.equal(body.duplicate, false)
  assert.equal(body.inFlight, false)
  assert.ok(body.messageId)
  assert.ok(body.conversationId)
  assert.ok(body.customerId)

  const customers = await store.listCustomers(owner.organization.id)
  const conversations = await store.listConversations(owner.organization.id)
  const messages = await store.listMessages(
    owner.organization.id,
    body.conversationId!,
    100
  )
  const events = await store.listOutboxEvents(owner.organization.id)

  assert.equal(customers.length, 1)
  assert.equal(conversations.length, 1)
  assert.equal(messages.length, 1)
  assert.equal(messages[0]?.provider, "widget")
  assert.equal(messages[0]?.providerAccountId, "site-1")
  assert.equal(messages[0]?.providerMessageId, "widget-event-001")
  assert.equal(messages[0]?.authorType, "CUSTOMER")
  assert.equal(events.filter((event) => event.eventType === "conversation.message.received").length, 1)
})

storeTest("phase 3: widget readback returns only the visitor conversation", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const inbound = await call(
    handle,
    "POST",
    "/public/v1/widget/" + integration.publicKey + "/messages",
    {
      origin: "https://shop.example",
      widgetMessageId: "widget-readback-001",
      body: {
        visitorId: "visitor-readback",
        content: "Where is my order?",
      },
    }
  )
  assert.equal(inbound.status, 202)
  const inboundBody = (await inbound.json()) as { conversationId: string }

  await store.appendMessage({
    organizationId: owner.organization.id,
    conversationId: inboundBody.conversationId,
    direction: "OUTBOUND",
    authorType: "AI",
    content: "Your order is on the way.",
    clientMessageId: "reply-001",
  })

  const response = await call(
    handle,
    "GET",
    "/public/v1/widget/" + integration.publicKey + "/messages?visitorId=visitor-readback"
  )
  assert.equal(response.status, 200)

  const body = (await response.json()) as {
    conversationId: string
    items: Array<{ direction: string; authorType: string; content: string }>
  }
  assert.equal(body.conversationId, inboundBody.conversationId)
  assert.deepEqual(
    body.items.map((item) => [item.direction, item.authorType, item.content]),
    [
      ["INBOUND", "CUSTOMER", "Where is my order?"],
      ["OUTBOUND", "AI", "Your order is on the way."],
    ]
  )

  const otherVisitor = await call(
    handle,
    "GET",
    "/public/v1/widget/" + integration.publicKey + "/messages?visitorId=other-visitor"
  )
  assert.equal(otherVisitor.status, 200)
  assert.deepEqual((await otherVisitor.json()).items, [])
})

storeTest("phase 3: provider event dedupe happens before business mutation", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const path = "/public/v1/widget/" + integration.publicKey + "/messages"
  const input = {
    visitorId: "visitor-1",
    customerDisplayName: "Alice",
    content: "Can I return this?",
  }

  const first = await call(handle, "POST", path, {
    origin: "https://shop.example",
    widgetMessageId: "duplicate-event",
    body: input,
  })
  const second = await call(handle, "POST", path, {
    origin: "https://shop.example",
    widgetMessageId: "duplicate-event",
    body: input,
  })

  assert.equal(first.status, 202)
  assert.equal(second.status, 202)

  const firstBody = (await first.json()) as {
    duplicate: boolean
    inFlight: boolean
    conversationId: string | null
    messageId: string | null
  }
  const secondBody = (await second.json()) as {
    duplicate: boolean
    inFlight: boolean
    conversationId: string | null
    messageId: string | null
  }

  assert.equal(firstBody.duplicate, false)
  assert.equal(secondBody.duplicate, true)
  assert.equal(secondBody.inFlight, false)
  assert.equal(secondBody.conversationId, null)
  assert.equal(secondBody.messageId, firstBody.messageId)

  const messages = await store.listMessages(
    owner.organization.id,
    firstBody.conversationId!,
    100
  )
  assert.equal(messages.length, 1)
  assert.equal((await store.listCustomers(owner.organization.id)).length, 1)
  assert.equal((await store.listConversations(owner.organization.id)).length, 1)
})

storeTest("phase 3: failed inbound event claims can be reclaimed after the lease", async (makeStore) => {
  const store = await makeStore()
  const owner = await signup(
    await createApp(store),
    "Alpha",
    "owner@alpha.example"
  )
  const integration = await store.createChannelIntegration({
    organizationId: owner.organization.id,
    provider: "widget",
    providerAccountId: "site-1",
    displayName: "Website chat",
    allowedOrigins: ["https://shop.example"],
    capabilities: {
      inbound_text: true,
      outbound_text: false,
    },
    credentialRef: null,
  })

  const input = {
    organizationId: owner.organization.id,
    integrationId: integration.id,
    providerEventId: "retryable-event",
    eventType: "message.received",
    payloadHash: "same-payload",
    correlationId: "retryable-event",
  }

  const first = await store.claimInboundEvent(input)
  assert.equal(first.claimed, true)
  assert.equal(first.event.attempts, 1)

  await store.failInboundEvent(owner.organization.id, first.event.id, "temporary failure")

  const second = await store.claimInboundEvent(input)
  assert.equal(second.claimed, true)
  assert.equal(second.inFlight, false)
  assert.equal(second.event.attempts, 2)
  assert.equal(second.event.lastError, null)
})

storeTest("phase 3: reusing a provider event id with a different payload is a conflict", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const path = "/public/v1/widget/" + integration.publicKey + "/messages"

  const first = await call(handle, "POST", path, {
    origin: "https://shop.example",
    widgetMessageId: "conflicting-event",
    body: {
      visitorId: "visitor-1",
      content: "hello",
    },
  })
  assert.equal(first.status, 202)

  const conflicting = await call(handle, "POST", path, {
    origin: "https://shop.example",
    widgetMessageId: "conflicting-event",
    body: {
      visitorId: "visitor-1",
      content: "different payload",
    },
  })

  assert.equal(conflicting.status, 409)
  assert.equal(
    (await conflicting.json()).error.code,
    "INBOUND_EVENT_CONFLICT"
  )
  assert.equal((await store.listCustomers(owner.organization.id)).length, 1)
  assert.equal((await store.listConversations(owner.organization.id)).length, 1)
  assert.equal(
    (await store.listMessages(
      owner.organization.id,
      (await first.json()).conversationId,
      100
    )).length,
    1
  )
})

storeTest("phase 3: disallowed browser origin is rejected before mutation", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const response = await call(
    handle,
    "POST",
    "/public/v1/widget/" + integration.publicKey + "/messages",
    {
      origin: "https://attacker.example",
      widgetMessageId: "forbidden-origin",
      body: {
        visitorId: "visitor-attacker",
        content: "ignore",
      },
    }
  )

  assert.equal(response.status, 403)
  assert.equal((await store.listCustomers(owner.organization.id)).length, 0)
})

storeTest("phase 3: stable client message id is mandatory for widget idempotency", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const response = await call(
    handle,
    "POST",
    "/public/v1/widget/" + integration.publicKey + "/messages",
    {
      origin: "https://shop.example",
      body: {
        visitorId: "visitor-1",
        content: "hello",
      },
    }
  )

  assert.equal(response.status, 400)
  assert.equal((await response.json()).error.code, "VALIDATION_ERROR")
})

storeTest("phase 3: widget CORS preflight is explicit", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "owner@alpha.example")
  const integration = await createWidget(handle, owner.session.accessToken)

  const response = await call(
    handle,
    "OPTIONS",
    "/public/v1/widget/" + integration.publicKey + "/messages",
    { origin: "https://shop.example" }
  )

  assert.equal(response.status, 204)
  assert.equal(response.headers.get("access-control-allow-origin"), "*")
  assert.match(
    response.headers.get("access-control-allow-methods") ?? "",
    /POST/
  )
})

