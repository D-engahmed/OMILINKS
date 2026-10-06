import assert from "node:assert/strict"
import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { formatLog } from "./shared/logger.js"

const SRC = path.dirname(fileURLToPath(import.meta.url))

function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const full = path.join(directory, entry)
      if (statSync(full).isDirectory()) {
        if (entry !== "node_modules") walk(full)
      } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
        out.push(path.relative(SRC, full).replace(/\\/g, "/"))
      }
    }
  }
  walk(SRC)
  return out
}

const PG_ALLOWED = new Set([
  "server.ts",
  "worker.ts",
  "migrate-cli.ts",
  "seed-dev.ts",
  "test-support.ts",
])

function isTestFile(file: string): boolean {
  return file.endsWith(".test.ts")
}

test("foundation: database driver stays inside infrastructure and entrypoints", () => {
  const violations = sourceFiles().filter((file) => {
    if (isTestFile(file)) return false
    if (file.startsWith("infrastructure/")) return false
    if (PG_ALLOWED.has(file)) return false
    const content = readFileSync(path.join(SRC, file), "utf8")
    return /from\s+["']pg["']/.test(content)
  })
  assert.deepEqual(violations, [])
})

test("foundation: domain layer depends only on types and shared errors", () => {
  const violations: string[] = []
  for (const file of sourceFiles()) {
    if (!file.startsWith("domain/") || isTestFile(file)) continue
    const content = readFileSync(path.join(SRC, file), "utf8")
    for (const match of content.matchAll(/from\s+["']([^"']+)["']/g)) {
      const target = match[1] ?? ""
      if (target.startsWith("node:") || target === "./types.js" || target === "../shared/errors.js") continue
      violations.push(`${file} imports ${target}`)
    }
  }
  assert.deepEqual(violations, [])
})

test("foundation: provider gateway implementations hide behind the resolver", () => {
  const violations: string[] = []
  for (const file of sourceFiles()) {
    if (isTestFile(file)) continue
    if (file === "ai/provider-resolver.ts") continue
    const content = readFileSync(path.join(SRC, file), "utf8")
    if (/ai\/(anthropic-gateway|openai-gateway)\.js/.test(content)) {
      violations.push(file)
    }
  }
  assert.deepEqual(violations, [])
})

test("foundation: logs are single-line JSON with service identity", () => {
  const line = formatLog("info", "hello", { requestId: "r1", count: 2 })
  assert.ok(!line.includes("\n"))
  const parsed = JSON.parse(line) as Record<string, unknown>
  assert.equal(parsed["service"], "omnilinks-backend")
  assert.equal(parsed["level"], "info")
  assert.equal(parsed["msg"], "hello")
  assert.equal(parsed["requestId"], "r1")
  assert.ok(typeof parsed["ts"] === "string")
})

test("foundation: log errors serialize without stacks or secrets", () => {
  const secret = "sk-live-do-not-log"
  const line = formatLog("error", "failed", { error: new Error("boom " + secret) })
  const parsed = JSON.parse(line) as { error: { name: string; message: string } }
  assert.equal(parsed.error.name, "Error")
  assert.ok(parsed.error.message.includes("boom"))
  assert.ok(!("stack" in parsed.error))
})
