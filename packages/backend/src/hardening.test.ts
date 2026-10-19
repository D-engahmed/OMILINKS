import assert from "node:assert/strict"
import type { AddressInfo } from "node:net"

import { createApp } from "./app.js"
import { createNodeServer } from "./node-server.js"
import { storeTest } from "./test-support.js"

type Handle = (request: Request) => Promise<Response>

async function post(
  handle: Handle,
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<Response> {
  return handle(
    new Request("http://localhost" + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    })
  )
}

async function signup(handle: Handle, name: string, email: string) {
  const response = await post(handle, "/api/v1/auth/signup", {
    organizationName: name,
    email,
    displayName: name + " Owner",
  })
  assert.equal(response.status, 201)
  return (await response.json()) as {
    organization: { id: string }
    user: { id: string }
    session: { accessToken: string }
  }
}

const auth = (token: string) => ({ authorization: "Bearer " + token })

async function newCustomer(handle: Handle, token: string, externalId: string) {
  const response = await post(
    handle,
    "/api/v1/customers",
    {
      displayName: "Alice",
      externalIdentity: {
        provider: "whatsapp",
        channelAccountId: "acct-1",
        externalId,
      },
    },
    auth(token)
  )
  return response
}

storeTest("duplicate organization slug is a conflict, not a crash", async (makeStore) => {
  const handle = await createApp(await makeStore())
  await signup(handle, "Alpha", "a@alpha.example")

  const second = await post(handle, "/api/v1/auth/signup", {
    organizationName: "Alpha",
    email: "other@alpha.example",
    displayName: "Other Owner",
  })

  assert.equal(second.status, 409)
})

storeTest("idempotency key reused with a different request is rejected", async (makeStore) => {
  const handle = await createApp(await makeStore())

  const first = await post(
    handle,
    "/api/v1/auth/signup",
    { organizationName: "Alpha", email: "a@alpha.example", displayName: "Alpha Owner" },
    { "Idempotency-Key": "k-1" }
  )
  assert.equal(first.status, 201)

  const second = await post(
    handle,
    "/api/v1/auth/signup",
    { organizationName: "Beta", email: "b@beta.example", displayName: "Beta Owner" },
    { "Idempotency-Key": "k-1" }
  )
  assert.equal(second.status, 422)
})

storeTest("malformed ids are not found, never a server error", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "a@alpha.example")

  for (const path of [
    "/api/v1/customers/not-a-uuid",
    "/api/v1/conversations/not-a-uuid",
  ]) {
    const response = await handle(
      new Request("http://localhost" + path, { headers: auth(owner.session.accessToken) })
    )
    assert.equal(response.status, 404, path)
  }

  const message = await post(
    handle,
    "/api/v1/conversations/not-a-uuid/messages",
    { content: "hello" },
    auth(owner.session.accessToken)
  )
  assert.equal(message.status, 404)
})

storeTest("workforce members cannot be linked to a user outside the tenant", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const alpha = await signup(handle, "Alpha", "a@alpha.example")
  const beta = await signup(handle, "Beta", "b@beta.example")

  const foreign = await post(
    handle,
    "/api/v1/workforce/members",
    { displayName: "Intruder", userId: beta.user.id },
    auth(alpha.session.accessToken)
  )
  assert.equal(foreign.status, 404)

  const own = await post(
    handle,
    "/api/v1/workforce/members",
    { displayName: "Alpha Agent", userId: alpha.user.id },
    auth(alpha.session.accessToken)
  )
  assert.equal(own.status, 201)
})

storeTest("parallel creates for one customer identity yield exactly one customer", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "a@alpha.example")

  const responses = await Promise.all(
    Array.from({ length: 10 }, () =>
      newCustomer(handle, owner.session.accessToken, "same-customer")
    )
  )

  const statuses = responses.map((response) => response.status).sort()
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 200, 200, 200, 201])

  const list = await handle(
    new Request("http://localhost/api/v1/customers", {
      headers: auth(owner.session.accessToken),
    })
  )
  const body = (await list.json()) as { items: unknown[] }
  assert.equal(body.items.length, 1)
})

storeTest("parallel assignments with the same version: exactly one wins", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "a@alpha.example")
  const token = owner.session.accessToken

  const customer = (await (await newCustomer(handle, token, "c-1")).json()) as {
    customer: { id: string }
  }

  const conversation = (await (
    await post(
      handle,
      "/api/v1/conversations",
      { customerId: customer.customer.id, channel: "web" },
      auth(token)
    )
  ).json()) as { id: string; version: number }

  const [agentA, agentB] = await Promise.all(
    ["Agent A", "Agent B"].map(async (displayName) =>
      (await (
        await post(
          handle,
          "/api/v1/workforce/members",
          { displayName, type: "HUMAN" },
          auth(token)
        )
      ).json()) as { id: string }
    )
  )

  const results = await Promise.all(
    [agentA!, agentB!].map((agent) =>
      post(
        handle,
        "/api/v1/workforce/assignments",
        {
          conversationId: conversation.id,
          workforceMemberId: agent.id,
          reason: "race",
          conversationVersion: conversation.version,
        },
        auth(token)
      )
    )
  )

  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409])
})

storeTest("real HTTP server forwards request bodies and enforces size limits", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const server = createNodeServer(handle, { maxRequestBytes: 2048 })

  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  const base = `http://127.0.0.1:${port}`

  try {
    const signupResponse = await fetch(base + "/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationName: "Alpha",
        email: "a@alpha.example",
        displayName: "Alpha Owner",
      }),
    })
    assert.equal(signupResponse.status, 201)
    assert.ok(signupResponse.headers.get("x-request-id"))

    const oversized = await fetch(base + "/api/v1/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationName: "x".repeat(5000) }),
    })
    assert.equal(oversized.status, 413)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
