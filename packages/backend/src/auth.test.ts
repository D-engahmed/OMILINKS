import assert from "node:assert/strict"
import test from "node:test"
import { setTimeout as sleep } from "node:timers/promises"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"
import { DevIdentityProvider, type IdentityProvider } from "./application/identity.js"
import { storeTest } from "./test-support.js"

type Handle = (request: Request) => Promise<Response>

function call(
  handle: Handle,
  method: string,
  path: string,
  options: { body?: unknown; token?: string; org?: string; headers?: Record<string, string> } = {}
): Promise<Response> {
  const headers: Record<string, string> = { ...options.headers }
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

interface SignedUp {
  organization: { id: string }
  user: { id: string; email: string }
  session: { accessToken: string; expiresInSeconds: number }
}

async function signup(handle: Handle, name: string, email: string, extra: Record<string, unknown> = {}) {
  const response = await call(handle, "POST", "/api/v1/auth/signup", {
    body: { organizationName: name, email, displayName: name + " Owner", ...extra },
  })
  assert.equal(response.status, 201)
  return (await response.json()) as SignedUp
}

storeTest("login returns a working session and does not reveal unknown accounts", async (makeStore) => {
  const handle = await createApp(await makeStore())
  await signup(handle, "Alpha", "a@alpha.example")

  const login = await call(handle, "POST", "/api/v1/auth/login", {
    body: { email: "A@Alpha.example" },
  })
  assert.equal(login.status, 200)
  const body = (await login.json()) as {
    session: { accessToken: string }
    memberships: { role: string }[]
  }
  assert.equal(body.memberships[0]?.role, "OWNER")

  const me = await call(handle, "GET", "/api/v1/organizations/me", { token: body.session.accessToken })
  assert.equal(me.status, 200)

  const unknown = await call(handle, "POST", "/api/v1/auth/login", {
    body: { email: "nobody@alpha.example" },
  })
  assert.equal(unknown.status, 401)
  assert.equal(((await unknown.json()) as { error: { code: string } }).error.code, "INVALID_CREDENTIALS")
})

storeTest("sessions expire", async (makeStore) => {
  const handle = await createApp(await makeStore(), { sessionTtlSeconds: 1 })
  const owner = await signup(handle, "Alpha", "a@alpha.example")
  assert.equal(owner.session.expiresInSeconds, 1)

  const token = owner.session.accessToken
  assert.equal((await call(handle, "GET", "/api/v1/organizations/me", { token })).status, 200)

  await sleep(1300)
  assert.equal((await call(handle, "GET", "/api/v1/organizations/me", { token })).status, 401)
})

storeTest("logout revokes only the current session", async (makeStore) => {
  const handle = await createApp(await makeStore())
  const owner = await signup(handle, "Alpha", "a@alpha.example")
  const first = owner.session.accessToken

  const second = (await (
    await call(handle, "POST", "/api/v1/auth/login", { body: { email: "a@alpha.example" } })
  ).json()) as { session: { accessToken: string } }

  assert.equal((await call(handle, "POST", "/api/v1/auth/logout", { token: first })).status, 200)
  assert.equal((await call(handle, "GET", "/api/v1/organizations/me", { token: first })).status, 401)
  assert.equal(
    (await call(handle, "GET", "/api/v1/organizations/me", { token: second.session.accessToken })).status,
    200
  )
})

storeTest("users in several organizations must choose one, and the role follows the choice", async (makeStore) => {
  const store = await makeStore()
  const handle = await createApp(store)
  const alpha = await signup(handle, "Alpha", "a@alpha.example")
  const beta = await signup(handle, "Beta", "b@beta.example")
  const gamma = await signup(handle, "Gamma", "g@gamma.example")

  await store.createMembership({
    userId: alpha.user.id,
    organizationId: beta.organization.id,
    role: "AGENT",
  })

  const token = alpha.session.accessToken
  const me = (org?: string) =>
    call(handle, "GET", "/api/v1/organizations/me", { token, ...(org ? { org } : {}) })

  const ambiguous = await me()
  assert.equal(ambiguous.status, 400)
  assert.equal(((await ambiguous.json()) as { error: { code: string } }).error.code, "ORGANIZATION_REQUIRED")

  const asAlpha = (await (await me(alpha.organization.id)).json()) as { membership: { role: string } }
  assert.equal(asAlpha.membership.role, "OWNER")

  const asBeta = (await (await me(beta.organization.id)).json()) as { membership: { role: string } }
  assert.equal(asBeta.membership.role, "AGENT")

  assert.equal((await me(gamma.organization.id)).status, 403)
  assert.equal((await me("not-a-uuid")).status, 403)

  // The AGENT role in Beta cannot manage workforce, the OWNER role in Alpha can.
  const member = { displayName: "Someone", type: "HUMAN" }
  assert.equal(
    (await call(handle, "POST", "/api/v1/workforce/members", { token, org: beta.organization.id, body: member })).status,
    403
  )
  assert.equal(
    (await call(handle, "POST", "/api/v1/workforce/members", { token, org: alpha.organization.id, body: member })).status,
    201
  )

  // Data created under Beta's context is Beta's data.
  const created = await call(handle, "POST", "/api/v1/customers", {
    token,
    org: beta.organization.id,
    body: { displayName: "Bea", externalIdentity: { provider: "web", channelAccountId: "w", externalId: "bea" } },
  })
  assert.equal(created.status, 201)

  const betaList = (await (
    await call(handle, "GET", "/api/v1/customers", { token: beta.session.accessToken })
  ).json()) as { items: unknown[] }
  const alphaList = (await (
    await call(handle, "GET", "/api/v1/customers", { token, org: alpha.organization.id })
  ).json()) as { items: unknown[] }
  assert.equal(betaList.items.length, 1)
  assert.equal(alphaList.items.length, 0)

  const login = (await (
    await call(handle, "POST", "/api/v1/auth/login", { body: { email: "a@alpha.example" } })
  ).json()) as { memberships: unknown[] }
  assert.equal(login.memberships.length, 2)
})

storeTest("identity comes from the provider, not from the request body", async (makeStore) => {
  const provider: IdentityProvider = {
    name: "stub",
    async verify({ credential }) {
      return credential === "proof-for-real" ? { email: "real@example.com" } : null
    },
  }
  const handle = await createApp(await makeStore(), { identity: provider })

  const rejected = await call(handle, "POST", "/api/v1/auth/signup", {
    body: { organizationName: "Alpha", email: "real@example.com", displayName: "Real Owner", credential: "wrong" },
  })
  assert.equal(rejected.status, 401)

  const accepted = await signup(handle, "Alpha", "attacker@example.com", { credential: "proof-for-real" })
  assert.equal(accepted.user.email, "real@example.com")

  const badLogin = await call(handle, "POST", "/api/v1/auth/login", {
    body: { email: "real@example.com", credential: "wrong" },
  })
  assert.equal(badLogin.status, 401)

  const goodLogin = await call(handle, "POST", "/api/v1/auth/login", {
    body: { email: "whoever@example.com", credential: "proof-for-real" },
  })
  assert.equal(goodLogin.status, 200)
  assert.equal(((await goodLogin.json()) as { user: { email: string } }).user.email, "real@example.com")
})

test("the dev identity provider cannot run in production", () => {
  assert.throws(() => new DevIdentityProvider("production"), /cannot run in production/)
  assert.equal(loadConfig({ NODE_ENV: "production" }).identityProvider, null)
  assert.equal(loadConfig({ NODE_ENV: "development" }).identityProvider, "dev")
  assert.throws(() => loadConfig({ IDENTITY_PROVIDER: "magic" }), /Unsupported/)
})
