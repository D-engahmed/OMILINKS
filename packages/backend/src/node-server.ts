import { createServer, type IncomingMessage, type Server } from "node:http"

import { AppError } from "./shared/errors.js"
import { errorResponse, getRequestId } from "./shared/http.js"

async function readBody(
  incoming: IncomingMessage,
  maxBytes: number
): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of incoming) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength

    if (size > maxBytes) {
      throw new AppError(413, "REQUEST_TOO_LARGE", "Request body is too large.")
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

export function createNodeServer(
  handle: (request: Request) => Promise<Response>,
  options: { maxRequestBytes: number }
): Server {
  return createServer(async (incoming, outgoing) => {
    let requestId = "unknown"

    try {
      const host = incoming.headers.host ?? "localhost"
      const headers = new Headers()

      for (const [key, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) {
          headers.set(key, value.join(", "))
        } else if (value !== undefined) {
          headers.set(key, value)
        }
      }

      const method = incoming.method ?? "GET"
      requestId = getRequestId(new Request("http://x", { headers }))
      headers.set("x-request-id", requestId)

      const hasBody = method !== "GET" && method !== "HEAD"
      const body = hasBody
        ? await readBody(incoming, options.maxRequestBytes)
        : undefined

      const request = new Request(`http://${host}${incoming.url ?? "/"}`, {
        method,
        headers,
        ...(body && body.byteLength > 0 ? { body: new Uint8Array(body) } : {}),
      })

      const response = await handle(request)
      const text = await response.text()
      const responseHeaders: Record<string, string> = {}

      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      outgoing.writeHead(response.status, responseHeaders)
      outgoing.end(text)
    } catch (error) {
      if (!(error instanceof AppError)) console.error(error)

      const response = errorResponse(error, requestId)
      outgoing.writeHead(response.status, {
        "content-type": "application/json; charset=utf-8",
        "x-request-id": requestId,
      })
      outgoing.end(await response.text())
    }
  })
}
