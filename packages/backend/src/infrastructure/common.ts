import { createHash } from "node:crypto"

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function hashRequest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
