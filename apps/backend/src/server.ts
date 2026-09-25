import { createServer } from "node:http"

import { handle } from "./app.js"

const port = Number.parseInt(process.env.PORT ?? "4000", 10)

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535")
}

const server = createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host ?? `localhost:${port}`
    const request = new Request(
      `http://${host}${incoming.url ?? "/"}`,
      {
        method: incoming.method ?? "GET",
        headers: Object.entries(incoming.headers).flatMap(([key, value]) =>
          value === undefined
            ? []
            : [[key, Array.isArray(value) ? value.join(", ") : value]]
        ),
      }
    )

    const response = await handle(request)

    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    outgoing.end(await response.text())
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
  console.log(`OMILINKS backend listening on http://localhost:${port}`)
})
