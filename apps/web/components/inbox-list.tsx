"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { api, ApiError } from "@/lib/api"
import { useAuthenticatedSession } from "@/components/session-context"
import type { InboxRow } from "@/lib/types"

export interface InboxFilters {
  statuses: string[]
  controls: string[]
  assigned: string
}

const ALL_STATUSES = ["OPEN", "ASSIGNED", "WAITING_CUSTOMER", "PENDING_REVIEW", "REOPENED"]
const ALL_CONTROLS = ["human", "ai", "queue"]

function timeAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime()
  if (delta < 60_000) return "just now"
  if (delta < 3_600_000) return Math.floor(delta / 60_000) + "m ago"
  if (delta < 86_400_000) return Math.floor(delta / 3_600_000) + "h ago"
  return new Date(iso).toLocaleDateString()
}

export function InboxList({ selectedId }: { selectedId: string | null }) {
  const session = useAuthenticatedSession()
  const [rows, setRows] = useState<InboxRow[]>([])
  const [filters, setFilters] = useState<InboxFilters>({
    statuses: ALL_STATUSES,
    controls: ALL_CONTROLS,
    assigned: "any",
  })
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      const result = await api<{ items: InboxRow[] }>("/api/v1/inbox", {
        token: session.token,
        organizationId: session.organizationId,
        query: {
          status: filters.statuses,
          control: filters.controls,
          assigned: filters.assigned,
          limit: "100",
        },
      })
      setRows(result.items)
      setStatus("ready")
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Inbox failed to load.")
      setStatus("error")
    }
  }, [session.token, session.organizationId, filters])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 5000)
    const onFocus = () => void load()
    window.addEventListener("focus", onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener("focus", onFocus)
    }
  }, [load])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
        <label className="text-xs text-muted-foreground">
          Status{" "}
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={filters.statuses.length === ALL_STATUSES.length ? "all" : filters.statuses[0] ?? "all"}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                statuses: event.target.value === "all" ? ALL_STATUSES : [event.target.value],
              }))
            }
          >
            <option value="all">All open</option>
            {ALL_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Control{" "}
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={filters.controls.length === ALL_CONTROLS.length ? "all" : filters.controls[0] ?? "all"}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                controls: event.target.value === "all" ? ALL_CONTROLS : [event.target.value],
              }))
            }
          >
            <option value="all">human + ai + queue</option>
            {ALL_CONTROLS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-muted-foreground">
          Assignment{" "}
          <select
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={filters.assigned}
            onChange={(event) =>
              setFilters((current) => ({ ...current, assigned: event.target.value }))
            }
          >
            <option value="any">Any</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>
        <Button variant="ghost" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {status === "loading" ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading inbox…</p>
        ) : status === "error" ? (
          <p role="alert" className="px-4 py-6 text-sm text-destructive">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            No conversations match these filters.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <li key={row.conversation.id}>
                <Link
                  href={"/inbox/" + row.conversation.id}
                  className={
                    "block px-4 py-3 hover:bg-muted " +
                    (selectedId === row.conversation.id ? "bg-muted" : "")
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {row.customer.displayName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(row.conversation.updatedAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                    <span className="rounded border px-1.5 py-0.5">{row.conversation.channel}</span>
                    <span className="rounded border px-1.5 py-0.5">{row.conversation.status}</span>
                    <span className="rounded border px-1.5 py-0.5">control:{row.conversation.control}</span>
                    {row.openHandoff ? (
                      <span className="rounded border border-amber-500/50 px-1.5 py-0.5 text-amber-700 dark:text-amber-300">
                        handoff:{row.openHandoff.reason}
                      </span>
                    ) : null}
                    {row.assignee ? (
                      <span className="rounded border px-1.5 py-0.5">
                        {row.assignee.displayName}
                      </span>
                    ) : (
                      <span className="rounded border border-dashed px-1.5 py-0.5 text-muted-foreground">
                        unassigned
                      </span>
                    )}
                  </div>
                  {row.lastMessage ? (
                    <p dir="auto" className="mt-1 truncate text-sm text-muted-foreground">
                      {row.lastMessage.authorType === "CUSTOMER" ? "" : row.lastMessage.authorType + ": "}
                      {row.lastMessage.content}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
