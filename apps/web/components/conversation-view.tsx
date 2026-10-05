"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { api, ApiError } from "@/lib/api"
import { useAuthenticatedSession } from "@/components/session-context"
import type { ChatMessage, Conversation, Customer, Handoff, WorkforceMember } from "@/lib/types"

export function ConversationView({ conversationId }: { conversationId: string }) {
  const session = useAuthenticatedSession()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [handoffs, setHandoffs] = useState<Handoff[]>([])
  const [draft, setDraft] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)

  const auth = { token: session.token, organizationId: session.organizationId }

  const load = useCallback(async () => {
    try {
      const [detail, history, open] = await Promise.all([
        api<Conversation>("/api/v1/conversations/" + conversationId, auth),
        api<{ items: ChatMessage[] }>(
          "/api/v1/conversations/" + conversationId + "/messages",
          { ...auth, query: { limit: "100" } }
        ),
        api<{ items: Handoff[] }>("/api/v1/handoffs", {
          ...auth,
          query: { conversationId, status: "OPEN" },
        }),
      ])
      setConversation(detail)
      setMessages(history.items)
      setHandoffs(open.items)
      const owner = await api<Customer>("/api/v1/customers/" + detail.customerId, auth)
      setCustomer(owner)
      setError("")
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Conversation failed to load.")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, session.organizationId, conversationId])

  useEffect(() => {
    void load()
    const timer = setInterval(() => void load(), 5000)
    return () => clearInterval(timer)
  }, [load])

  async function send() {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setNotice("")
    try {
      const result = await api<{ id: string }>(
        "/api/v1/conversations/" + conversationId + "/messages",
        {
          ...auth,
          method: "POST",
          body: {
            content,
            clientMessageId:
              typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : Date.now().toString(36) + Math.random().toString(36).slice(2),
          },
        }
      )
      setDraft("")
      setNotice("Reply recorded (" + result.id.slice(0, 8) + "…).")
      await load()
    } catch (cause) {
      setNotice(cause instanceof ApiError ? cause.message : "Reply failed.")
    } finally {
      setSending(false)
    }
  }

  async function claim() {
    setNotice("")
    try {
      if (!conversation) return
      const members = await api<{ items: WorkforceMember[] }>(
        "/api/v1/workforce/members",
        auth
      )
      const me = members.items.find(
        (member) =>
          member.type === "HUMAN" &&
          member.status === "ACTIVE" &&
          member.userId === session.user.id
      )
      if (!me) {
        setNotice("No active human operator identity is linked to your user. Ask an admin to create one.")
        return
      }
      await api("/api/v1/workforce/assignments", {
        ...auth,
        method: "POST",
        body: {
          conversationId,
          workforceMemberId: me.id,
          reason: "operator claim from inbox",
          conversationVersion: conversation.version,
        },
      })
      setNotice("Claimed. You now own this conversation.")
      await load()
    } catch (cause) {
      setNotice(cause instanceof ApiError ? cause.message : "Claim failed.")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {customer?.displayName ?? "Conversation"}
          </h2>
          {conversation ? (
            <div className="flex flex-wrap gap-1 text-[11px]">
              <span className="rounded border px-1.5 py-0.5">{conversation.channel}</span>
              <span className="rounded border px-1.5 py-0.5">{conversation.status}</span>
              <span className="rounded border px-1.5 py-0.5">control:{conversation.control}</span>
            </div>
          ) : null}
        </div>
        {handoffs.length > 0 ? (
          <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
            {handoffs.map((handoff) => (
              <p key={handoff.id} dir="auto">
                <span className="font-medium">Handoff ({handoff.reason}): </span>
                {handoff.summary}
              </p>
            ))}
          </div>
        ) : null}
        {conversation?.control !== "human" ? (
          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => void claim()}>
              Claim for me
            </Button>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {messages.map((message) => {
          const mine = message.direction === "OUTBOUND"
          return (
            <div key={message.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div
                dir="auto"
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                  (mine ? "bg-primary text-primary-foreground" : "border bg-muted")
                }
              >
                <div>{message.content}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wide opacity-60">
                  {message.authorType}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a reply as the operator…"
          aria-label="Operator reply"
        />
        <Button type="submit" disabled={!draft.trim() || sending}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </form>
      {notice ? <p className="border-t px-4 py-1 text-xs text-muted-foreground">{notice}</p> : null}
    </div>
  )
}
