export interface AppConfig {
  serviceName: string
  apiVersion: string
  port: number
  environment: string
  maxRequestBytes: number
  databaseUrl: string | null
  identityProvider: "dev" | null
  sessionTtlSeconds: number
}

function positiveInt(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(name + " must be a positive integer")
  }
  return parsed
}

function identityProvider(env: NodeJS.ProcessEnv): "dev" | null {
  const value = env.IDENTITY_PROVIDER?.trim()

  if (value === undefined || value === "") {
    return env.NODE_ENV === "production" ? null : "dev"
  }

  if (value !== "dev") {
    throw new Error("Unsupported IDENTITY_PROVIDER: " + value)
  }

  return value
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    serviceName: env.SERVICE_NAME ?? "omnilinks-backend",
    apiVersion: "v1",
    port: positiveInt(env.PORT, 4000, "PORT"),
    environment: env.NODE_ENV ?? "development",
    maxRequestBytes: positiveInt(env.MAX_REQUEST_BYTES, 1_048_576, "MAX_REQUEST_BYTES"),
    databaseUrl: env.DATABASE_URL?.trim() || null,
    identityProvider: identityProvider(env),
    sessionTtlSeconds: positiveInt(env.SESSION_TTL_SECONDS, 43_200, "SESSION_TTL_SECONDS"),
  }
}
