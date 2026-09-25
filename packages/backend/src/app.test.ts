import assert from "node:assert/strict"
import test from "node:test"

import { handle } from "./app.js"

test("health endpoint returns service status", async () => {
  const response = await handle(
    new Request("http://localhost/health", { method: "GET" })
  )

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "omnilinks-backend",
  })
})

test("unknown routes return a stable not found envelope", async () => {
  const response = await handle(
    new Request("http://localhost/does-not-exist", { method: "GET" })
  )

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), {
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  })
})
