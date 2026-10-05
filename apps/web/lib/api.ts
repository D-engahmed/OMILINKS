export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

export function apiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_OMNILINKS_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
}

interface CallOptions {
  token: string
  organizationId: string
  method?: string
  body?: unknown
  query?: Record<string, string | string[] | undefined>
}

export async function api<T>(path: string, options: CallOptions): Promise<T> {
  const url = new URL(apiBaseUrl() + path)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === undefined) continue
    for (const item of Array.isArray(value) ? value : [value]) {
      url.searchParams.append(key, item)
    }
  }
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      authorization: "Bearer " + options.token,
      "x-organization-id": options.organizationId,
      ...(options.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string }
  } | null
  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "Request failed with status " + response.status
    )
  }
  return payload as T
}
