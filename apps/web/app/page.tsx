"use client"

import { Button } from "@workspace/ui/components/button"
import { InboxList } from "@/components/inbox-list"
import { LoginForm } from "@/components/login-form"
import { useSession } from "@/components/session-context"

export default function Page() {
  const { session, logout, switchOrganization } = useSession()

  if (!session) return <LoginForm />

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <h1 className="text-sm font-semibold">OmniLinks Inbox</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{session.user.email}</span>
          {session.memberships.length > 1 ? (
            <select
              aria-label="Organization"
              className="rounded-md border bg-background px-2 py-1"
              value={session.organizationId}
              onChange={(event) => switchOrganization(event.target.value)}
            >
              {session.memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organizationId.slice(0, 8)}… ({membership.role})
                </option>
              ))}
            </select>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
      </header>
      <InboxList selectedId={null} />
    </div>
  )
}
