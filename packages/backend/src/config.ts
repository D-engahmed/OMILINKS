export interface AppConfig {
  serviceName: string
  apiVersion: string
  port: number
  environment: string
  maxRequestBytes: number
}

function positiveInt(value: string | undefined, fallback: number, name: string): number {
  const parsed = value === undefined ? fallback : Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(name + " must be a positive integer")
  }
  return parsed
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    serviceName: env.SERVICE_NAME ?? "omnilinks-backend",
    apiVersion: "v1",
    port: positiveInt(env.PORT, 4000, "PORT"),
    environment: env.NODE_ENV ?? "development",
    maxRequestBytes: positiveInt(env.MAX_REQUEST_BYTES, 1_048_576, "MAX_REQUEST_BYTES"),
  }
}
