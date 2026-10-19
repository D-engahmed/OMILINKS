import { randomUUID } from "node:crypto"

import { AppError } from "./errors.js"

export function json(
  body: unknown,
  status = 200,
  headers?: HeadersInit
): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  })
}

export function errorResponse(error: unknown, requestId: string): Response {
  if (error instanceof AppError) {
    return json(
      {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      error.status
    )
  }

  return json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        requestId,
      },
    },
    500
  )
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id")?.trim() || randomUUID()
}
