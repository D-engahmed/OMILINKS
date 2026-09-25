const SERVICE_NAME = "omnilinks-backend"

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status })
}

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url)

  if (request.method === "GET" && url.pathname === "/health") {
    return json({
      status: "ok",
      service: SERVICE_NAME,
    })
  }

  if (request.method === "GET" && url.pathname === "/api/v1") {
    return json({
      service: SERVICE_NAME,
      version: "v1",
    })
  }

  return json(
    {
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    },
    404
  )
}
