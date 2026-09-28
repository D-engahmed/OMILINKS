import assert from "node:assert/strict"
import test from "node:test"

import { createApp } from "./app.js"
import { MemoryStore } from "./infrastructure/store.js"

type SignupResponse = {
  organization: { id: string }
  user: { id: string }
  membership: { role: string }
  session: { accessToken: string }
  replayed: boolean
}

async function signup(
  handle: (request: Request) => Promise<Response>,
  name: string,
  email: string,
  key: string
): Promise<SignupResponse> {
  const response = await handle(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify({
        organizationName: name,
        email,
        displayName: name + " Owner",
      }),
    })
  )

  assert.equal(response.status, 201)
  return (await response.json()) as SignupResponse
}

async function createCustomer(
  handle: (request: Request) => Promise<Response>,
  token: string,
  externalId: string
) {
  const response = await handle(
    new Request("http://localhost/api/v1/customers", {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Alice",
        externalIdentity: {
          provider: "whatsapp",
          channelAccountId: "account-1",
          externalId,
        },
      }),
    })
  )

  assert.equal(response.status, 201)

  return response.json() as Promise<{
    customer: { id: string; version: number }
  }>
}

test("health is explicit and request-correlated", async () => {
  const handle = await createApp(new MemoryStore())

  const response = await handle(
    new Request("http://localhost/health", {
      method: "GET",
      headers: { "x-request-id": "req-test-1" },
    })
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("x-request-id"), "req-test-1")
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "omnilinks-backend",
    version: "v1",
    requestId: "req-test-1",
  })
})

test("signup provisions one owner and is idempotent", async () => {
  const handle = await createApp(new MemoryStore())

  const first = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-1"
  )

  const secondResponse = await handle(
    new Request("http://localhost/api/v1/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "signup-1",
      },
      body: JSON.stringify({
        organizationName: "Alpha",
        email: "owner@alpha.example",
        displayName: "Alpha Owner",
      }),
    })
  )

  assert.equal(secondResponse.status, 200)

  const second = (await secondResponse.json()) as SignupResponse

  assert.equal(second.organization.id, first.organization.id)
  assert.equal(second.user.id, first.user.id)
  assert.equal(second.membership.role, "OWNER")
  assert.equal(second.session.accessToken, first.session.accessToken)
  assert.equal(second.replayed, true)
})

test("organization context returns the authenticated tenant", async () => {
  const handle = await createApp(new MemoryStore())
  const result = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-2"
  )

  const response = await handle(
    new Request("http://localhost/api/v1/organizations/me", {
      method: "GET",
      headers: {
        authorization: "Bearer " + result.session.accessToken,
      },
    })
  )

  assert.equal(response.status, 200)

  const body = await response.json()
  assert.equal(body.organization.id, result.organization.id)
  assert.equal(body.membership.role, "OWNER")
})

test("cross-tenant customer access returns safe not-found", async () => {
  const handle = await createApp(new MemoryStore())

  const alpha = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-3"
  )

  const beta = await signup(
    handle,
    "Beta",
    "owner@beta.example",
    "signup-4"
  )

  const created = await createCustomer(
    handle,
    alpha.session.accessToken,
    "customer-1"
  )

  const response = await handle(
    new Request(
      "http://localhost/api/v1/customers/" + created.customer.id,
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + beta.session.accessToken,
        },
      }
    )
  )

  assert.equal(response.status, 404)

  const payload = await response.json()
  assert.equal(payload.error.code, "NOT_FOUND")
  assert.equal(payload.error.message, "Customer not found.")
})

test("same provider identity is deduplicated inside one tenant", async () => {
  const handle = await createApp(new MemoryStore())

  const owner = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-5"
  )

  const first = await createCustomer(
    handle,
    owner.session.accessToken,
    "same-user"
  )

  const second = await handle(
    new Request("http://localhost/api/v1/customers", {
      method: "POST",
      headers: {
        authorization: "Bearer " + owner.session.accessToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        displayName: "Same Person",
        externalIdentity: {
          provider: "whatsapp",
          channelAccountId: "account-1",
          externalId: "same-user",
        },
      }),
    })
  )

  assert.equal(second.status, 200)

  const secondBody = (await second.json()) as {
    customer: { id: string }
    created: boolean
  }

  assert.equal(secondBody.customer.id, first.customer.id)
  assert.equal(secondBody.created, false)
})

test("customer updates reject stale versions", async () => {
  const handle = await createApp(new MemoryStore())

  const owner = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-6"
  )

  const customer = await createCustomer(
    handle,
    owner.session.accessToken,
    "versioned"
  )

  const first = await handle(
    new Request(
      "http://localhost/api/v1/customers/" + customer.customer.id,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer " + owner.session.accessToken,
          "content-type": "application/json",
          "If-Match-Version": "1",
        },
        body: JSON.stringify({ displayName: "Alice V2" }),
      }
    )
  )

  assert.equal(first.status, 200)

  const stale = await handle(
    new Request(
      "http://localhost/api/v1/customers/" + customer.customer.id,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer " + owner.session.accessToken,
          "content-type": "application/json",
          "If-Match-Version": "1",
        },
        body: JSON.stringify({ displayName: "Stale" }),
      }
    )
  )

  assert.equal(stale.status, 409)
  assert.equal((await stale.json()).error.code, "STALE_VERSION")
})

test("assignment changes conversation control and version", async () => {
  const handle = await createApp(new MemoryStore())

  const owner = await signup(
    handle,
    "Alpha",
    "owner@alpha.example",
    "signup-7"
  )

  const customer = await createCustomer(
    handle,
    owner.session.accessToken,
    "assignment"
  )

  const conversationResponse = await handle(
    new Request("http://localhost/api/v1/conversations", {
      method: "POST",
      headers: {
        authorization: "Bearer " + owner.session.accessToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customerId: customer.customer.id,
        channel: "widget",
      }),
    })
  )

  assert.equal(conversationResponse.status, 201)
  const conversation = await conversationResponse.json()

  const workforceResponse = await handle(
    new Request("http://localhost/api/v1/workforce/members", {
      method: "POST",
      headers: {
        authorization: "Bearer " + owner.session.accessToken,
        "content-type": "application/json",
      },
      body: JSON.stringify({ displayName: "Agent One" }),
    })
  )

  assert.equal(workforceResponse.status, 201)
  const workforce = await workforceResponse.json()

  const assignmentResponse = await handle(
    new Request("http://localhost/api/v1/workforce/assignments", {
      method: "POST",
      headers: {
        authorization: "Bearer " + owner.session.accessToken,
        "content-type": "application/json",
        "If-Match-Version": String(conversation.version),
      },
      body: JSON.stringify({
        conversationId: conversation.id,
        workforceMemberId: workforce.id,
        conversationVersion: conversation.version,
        reason: "manual",
      }),
    })
  )

  assert.equal(assignmentResponse.status, 201)

  const current = await handle(
    new Request(
      "http://localhost/api/v1/conversations/" + conversation.id,
      {
        method: "GET",
        headers: {
          authorization: "Bearer " + owner.session.accessToken,
        },
      }
    )
  )

  const updated = await current.json()

  assert.equal(updated.control, "human")
  assert.equal(updated.status, "ASSIGNED")
  assert.equal(updated.controlVersion, 2)
  assert.equal(updated.version, 2)

  const staleAssignment = await handle(
    new Request("http://localhost/api/v1/workforce/assignments", {
      method: "POST",
      headers: {
        authorization: "Bearer " + owner.session.accessToken,
        "content-type": "application/json",
        "If-Match-Version": String(conversation.version),
      },
      body: JSON.stringify({
        conversationId: conversation.id,
        workforceMemberId: workforce.id,
        conversationVersion: conversation.version,
        reason: "stale",
      }),
    })
  )

  assert.equal(staleAssignment.status, 409)
  assert.equal((await staleAssignment.json()).error.code, "STALE_VERSION")
})

test("unauthenticated protected routes are rejected", async () => {
  const handle = await createApp(new MemoryStore())

  const response = await handle(
    new Request("http://localhost/api/v1/customers", { method: "GET" })
  )

  assert.equal(response.status, 401)
  assert.equal(
    (await response.json()).error.code,
    "AUTHENTICATION_REQUIRED"
  )
})

test("unknown routes return stable machine-readable errors", async () => {
  const handle = await createApp(new MemoryStore())

  const response = await handle(
    new Request("http://localhost/does-not-exist", { method: "GET" })
  )

  assert.equal(response.status, 404)

  const payload = await response.json()
  assert.equal(payload.error.code, "NOT_FOUND")
  assert.equal(payload.error.message, "Route not found.")
  assert.ok(typeof payload.error.requestId === "string")
})
