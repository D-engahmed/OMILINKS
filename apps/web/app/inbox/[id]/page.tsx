"use client"

import Link from "next/link"
import { use } from "react"

import { Button } from "@workspace/ui/components/button"
import { ConversationView } from "@/components/conversation-view"
import { InboxList } from "@/components/inbox-list"
import { LoginForm } from "@/components/login-form"
import { useSession } from "@/components/session-context"

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { session, logout } = useSession()

  if (!session) return <LoginForm />

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm">
              ← Inbox
            </Button>
          </Link>
          <h1 className="text-sm font-semibold">Conversation</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{session.user.email}</span>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 md:grid-cols-[320px_1fr]">
        <aside className="hidden min-h-0 flex-col border-r md:flex">
          <InboxList selectedId={id} />
        </aside>
        <ConversationView conversationId={id} />
      </div>
    </div>
  )
}
