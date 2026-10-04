"use client"

import { useEffect, useMemo, useState } from "react"

type WidgetConfig = {
  provider: "widget"
  publicKey: string
  displayName: string
  capabilities: Record<string, boolean>
  status: string
}

type ChatMessage = {
  id: string
  direction: "INBOUND" | "OUTBOUND"
  authorType: "CUSTOMER" | "HUMAN" | "AI" | "SYSTEM"
  content: string
  occurredAt: string
  status?: "sending" | "accepted"
}

function getOrCreateVisitorId(): string {
  const key = "omnilinks_widget_visitor_id"
  const existing = window.localStorage.getItem(key)
  if (existing) return existing

  const created =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)

  window.localStorage.setItem(key, created)
  return created
}

export function WidgetChat() {
  const apiUrl =
    process.env.NEXT_PUBLIC_OMNILINKS_API_URL ?? "http://localhost:3000"
  const publicKey = process.env.NEXT_PUBLIC_OMNILINKS_WIDGET_KEY ?? ""

  const [config, setConfig] = useState<WidgetConfig | null>(null)
  const [visitorId, setVisitorId] = useState("")
  const [content, setContent] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [state, setState] = useState<"loading" | "ready" | "error">(
    "loading"
  )
  const [error, setError] = useState("")

  useEffect(() => {
    setVisitorId(getOrCreateVisitorId())

    if (!publicKey) {
      setState("error")
      setError("NEXT_PUBLIC_OMNILINKS_WIDGET_KEY is not configured.")
      return
    }

    fetch(
      apiUrl.replace(/\/$/, "") +
        "/public/v1/widget/" +
        encodeURIComponent(publicKey) +
        "/config"
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Widget configuration failed.")
        return (await response.json()) as WidgetConfig
      })
      .then((value) => {
        setConfig(value)
        setState("ready")
      })
      .catch((cause: unknown) => {
        setState("error")
        setError(cause instanceof Error ? cause.message : "Connection failed.")
      })
  }, [apiUrl, publicKey])

  const endpoint = useMemo(
    () =>
      apiUrl.replace(/\/$/, "") +
      "/public/v1/widget/" +
      encodeURIComponent(publicKey) +
      "/messages",
    [apiUrl, publicKey]
  )

  useEffect(() => {
    if (state !== "ready" || !visitorId || !publicKey) return

    let active = true

    const syncMessages = async () => {
      try {
        const response = await fetch(
          endpoint + "?visitorId=" + encodeURIComponent(visitorId),
          { cache: "no-store" }
        )
        if (!response.ok) throw new Error("Conversation sync failed.")

        const body = (await response.json()) as {
          items: ChatMessage[]
        }

        if (active) {
          setMessages((current) => {
            const pending = current.filter(
              (message) =>
                message.status === "sending" &&
                !body.items.some((item) => item.id === message.id)
            )
            return [...body.items.map((item) => ({ ...item, status: "accepted" as const })), ...pending]
          })
        }
      } catch {
        // Polling is best-effort; the send path remains authoritative.
      }
    }

    void syncMessages()
    const timer = window.setInterval(() => void syncMessages(), 1500)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [endpoint, publicKey, state, visitorId])

  async function send() {
    const trimmed = content.trim()
    if (!trimmed || !visitorId || !publicKey || state !== "ready") return

    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    setMessages((current) => [
      ...current,
      {
        id,
        direction: "INBOUND",
        authorType: "CUSTOMER",
        content: trimmed,
        occurredAt: new Date().toISOString(),
        status: "sending",
      },
    ])
    setContent("")

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-widget-message-id": id,
        },
        body: JSON.stringify({
          visitorId,
          content: trimmed,
        }),
      })

      const body = (await response.json()) as {
        accepted?: boolean
        error?: { message?: string }
      }

      if (!response.ok || !body.accepted) {
        throw new Error(body.error?.message ?? "Message was not accepted.")
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, status: "accepted" } : message
        )
      )
      setError("")
    } catch (cause: unknown) {
      setMessages((current) => current.filter((message) => message.id !== id))
      setError(cause instanceof Error ? cause.message : "Message failed.")
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-950 p-6 text-white">
      <section className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 shadow-2xl">
        <header className="border-b border-white/10 px-5 py-4">
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            OmniLinks Channel
          </div>
          <h1 className="mt-1 text-lg font-semibold">
            {config?.displayName ?? "Website Support"}
          </h1>
          <p className="mt-1 text-xs text-white/50">
            {state === "ready"
              ? "Connected to your conversation."
              : state === "loading"
                ? "Connecting…"
                : "Channel configuration error"}
          </p>
        </header>

        <div className="min-h-72 space-y-3 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/50">
              Send a message to create or resume your conversation.
            </div>
          ) : (
            messages.map((message) => {
              const outbound = message.direction === "OUTBOUND"
              return (
                <div
                  key={message.id}
                  className={
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm " +
                    (outbound
                      ? "mr-auto rounded-bl-md bg-white/10 text-white"
                      : "ml-auto rounded-br-md bg-white text-neutral-950")
                  }
                >
                  <div>{message.content}</div>
                  <div
                    className={
                      "mt-1 text-[10px] uppercase tracking-wide " +
                      (outbound ? "text-white/40" : "text-neutral-500")
                    }
                  >
                    {message.status === "sending"
                      ? "sending"
                      : outbound
                        ? message.authorType.toLowerCase()
                        : "you"}
                  </div>
                </div>
              )
            })
          )}

          {error ? (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <form
          className="flex gap-2 border-t border-white/10 p-4"
          onSubmit={(event) => {
            event.preventDefault()
            void send()
          }}
        >
          <input
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write a message…"
            disabled={state !== "ready"}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!content.trim() || state !== "ready"}
            className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-neutral-950 transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          >
            Send
          </button>
        </form>
      </section>
    </main>
  )
}
