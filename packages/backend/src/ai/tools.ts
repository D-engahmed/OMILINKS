import { randomUUID } from "node:crypto"

/*
 * Tool runtime kernel: the hard boundary between model-generated intent and
 * real effects. Implements docs/ai/tool-runtime.md for the read-only subset:
 *
 *   registry lookup -> version check -> allow-list -> argument validation
 *   -> tenant scope -> risk gate -> idempotency -> execution -> audit
 *
 * Write-side-effect tools are registered but NEVER executed here: they return
 * APPROVAL_REQUIRED until durable approval plumbing exists. The model is not
 * wired to request tools yet; this module is the validated boundary the
 * future agent loop will call.
 *
 * Idempotency ledger is in-process only (Map). A process restart loses it,
 * so it protects against duplicate delivery within one process, not against
 * crashes. The durable invocation ledger is explicitly deferred.
 */

export type ToolSideEffect = "none" | "write"

export interface ToolDefinition {
  name: string
  version: number
  description: string
  sideEffect: ToolSideEffect
  requiredArgs: string[]
  timeoutMs: number
}

export type ToolHandler = (
  args: Record<string, unknown>,
  context: { organizationId: string; runId: string | null }
) => Promise<unknown>

export interface ToolPolicy {
  organizationId: string
  allowedTools: string[]
}

export interface ToolCall {
  tool: string
  version: number
  args: Record<string, unknown>
  idempotencyKey: string
  organizationId: string
  runId: string | null
}

export type ToolErrorCode =
  | "INVALID_TOOL"
  | "INVALID_ARGUMENTS"
  | "FORBIDDEN"
  | "APPROVAL_REQUIRED"
  | "PROVIDER_TIMEOUT"
  | "INTERNAL_ERROR"

export interface ToolAudit {
  invocationId: string
  tool: string
  version: number
  organizationId: string
  runId: string | null
  outcome: "EXECUTED" | "DENIED"
  errorCode: ToolErrorCode | null
  idempotentReplay: boolean
  durationMs: number
}

export interface ToolResult {
  ok: boolean
  output: unknown
  errorCode: ToolErrorCode | null
  audit: ToolAudit
}

const MAX_OUTPUT_CHARS = 8000

export class ToolRegistry {
  private readonly entries = new Map<string, { definition: ToolDefinition; handler: ToolHandler }>()

  register(definition: ToolDefinition, handler: ToolHandler): void {
    if (!/^[a-z][a-z0-9._-]{1,63}$/.test(definition.name)) {
      throw new Error("INVALID_TOOL_NAME")
    }
    if (!Number.isInteger(definition.version) || definition.version < 1) {
      throw new Error("INVALID_TOOL_VERSION")
    }
    this.entries.set(definition.name, { definition, handler })
  }

  get(name: string): { definition: ToolDefinition; handler: ToolHandler } | null {
    return this.entries.get(name) ?? null
  }
}

function deny(
  call: ToolCall,
  version: number,
  errorCode: ToolErrorCode,
  started: number
): ToolResult {
  return {
    ok: false,
    output: null,
    errorCode,
    audit: {
      invocationId: randomUUID(),
      tool: call.tool,
      version,
      organizationId: call.organizationId,
      runId: call.runId,
      outcome: "DENIED",
      errorCode,
      idempotentReplay: false,
      durationMs: Date.now() - started,
    },
  }
}

function projectOutput(value: unknown): unknown {
  let text: string
  try {
    text = JSON.stringify(value) ?? "null"
  } catch {
    return { truncated: true, value: "[unserializable]" }
  }
  if (text.length <= MAX_OUTPUT_CHARS) return value
  return { truncated: true, value: text.slice(0, MAX_OUTPUT_CHARS) }
}

export class ToolRuntime {
  private readonly ledger = new Map<string, ToolResult>()

  constructor(private readonly registry: ToolRegistry) {}

  async execute(policy: ToolPolicy, call: ToolCall): Promise<ToolResult> {
    const started = Date.now()
    const ledgerKey = `${policy.organizationId}:${call.tool}:v${call.version}:${call.idempotencyKey}`
    const replayed = this.ledger.get(ledgerKey)
    if (replayed) {
      return {
        ...replayed,
        audit: { ...replayed.audit, idempotentReplay: true, durationMs: Date.now() - started },
      }
    }

    const entry = this.registry.get(call.tool)
    if (!entry || entry.definition.version !== call.version) {
      return this.record(ledgerKey, deny(call, call.version, "INVALID_TOOL", started))
    }
    if (!policy.allowedTools.includes(call.tool)) {
      return this.record(ledgerKey, deny(call, entry.definition.version, "FORBIDDEN", started))
    }
    if (!call.args || typeof call.args !== "object" || Array.isArray(call.args)) {
      return this.record(ledgerKey, deny(call, entry.definition.version, "INVALID_ARGUMENTS", started))
    }
    for (const required of entry.definition.requiredArgs) {
      if (call.args[required] === undefined || call.args[required] === null) {
        return this.record(ledgerKey, deny(call, entry.definition.version, "INVALID_ARGUMENTS", started))
      }
    }
    // Tenant scope: a tool call can only touch its own organization.
    const argOrg = (call.args as Record<string, unknown>)["organizationId"]
    if (typeof argOrg === "string" && argOrg !== policy.organizationId) {
      return this.record(ledgerKey, deny(call, entry.definition.version, "FORBIDDEN", started))
    }
    if (entry.definition.sideEffect !== "none") {
      return this.record(ledgerKey, deny(call, entry.definition.version, "APPROVAL_REQUIRED", started))
    }

    const invocationId = randomUUID()
    try {
      const output = await entry.handler(call.args, {
        organizationId: policy.organizationId,
        runId: call.runId,
      })
      return this.record(ledgerKey, {
        ok: true,
        output: projectOutput(output),
        errorCode: null,
        audit: {
          invocationId,
          tool: call.tool,
          version: entry.definition.version,
          organizationId: policy.organizationId,
          runId: call.runId,
          outcome: "EXECUTED",
          errorCode: null,
          idempotentReplay: false,
          durationMs: Date.now() - started,
        },
      })
    } catch {
      return this.record(
        ledgerKey,
        deny(call, entry.definition.version, "INTERNAL_ERROR", started)
      )
    }
  }

  private record(key: string, result: ToolResult): ToolResult {
    this.ledger.set(key, result)
    return result
  }
}
