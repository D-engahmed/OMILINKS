"use client"

import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { useSession } from "@/components/session-context"

export function LoginForm() {
  const { error, login } = useSession()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    try {
      await login(email.trim())
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <section className="w-full max-w-sm rounded-2xl border p-6 shadow-sm">
        <h1 className="text-lg font-semibold">OmniLinks Operator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your operator email to open the inbox.
        </p>
        <form className="mt-4 flex flex-col gap-3" onSubmit={submit}>
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="operator@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" disabled={!email.trim() || busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </section>
    </main>
  )
}
