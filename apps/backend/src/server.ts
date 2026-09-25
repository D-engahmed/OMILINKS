import { createServer } from "node:http"

import { handle } from "./app.js"

const port = Number.parseInt(process.env.PORT ?? "4000", 10)

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535")
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host ?? `localhost:${port}`
    const headers = new Headers()

    for (const [key, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) {
        headers.set(key, value.join(", "))
      } else if (value !== undefined) {
        headers.set(key, value)
      }
    }

    const request = new Request(
      `http://${host}${incoming.url ?? "/"}`,
      {
        method: incoming.method ?? "GET",
        headers,
      }
    )

    const response = await handle(request)
    const body = await response.text()

    outgoing.writeHead(response.status, {
      "content-type":
        response.headers.get("content-type") ??
        "application/json; charset=utf-8",
    })
    outgoing.end(body)
  } catch (error) {
    console.error(error)
    outgoing.writeHead(500, {
      "content-type": "application/json; charset=utf-8",
    })
    outgoing.end(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      })
    )
  }
})

server.listen(port, () => {
  console.log(`OMNILINKS backend listening on http://localhost:${port}`)
})
