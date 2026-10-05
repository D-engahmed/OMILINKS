"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { api, apiBaseUrl } from "@/lib/api"
import type { SessionMembership, SessionUser } from "@/lib/types"

export interface Session {
  token: string
  organizationId: string
  user: SessionUser
  memberships: SessionMembership[]
}

interface SessionContextValue {
  session: Session | null
  error: string
  login: (email: string) => Promise<void>
  switchOrganization: (organizationId: string) => void
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Session material lives only in React state. It is never written to
  // localStorage: a stored token would become a long-lived credential that
  // outlives logout and revocation handling.
  const [session, setSession] = useState<Session | null>(null)
  const [error, setError] = useState("")

  const login = useCallback(async (email: string) => {
    setError("")
    try {
      const response = await fetch(apiBaseUrl() + "/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const payload = (await response.json().catch(() => null)) as {
        user?: SessionUser
        memberships?: SessionMembership[]
        session?: { accessToken?: string }
        error?: { message?: string }
      } | null
      if (!response.ok || !payload?.user || !payload.session?.accessToken || !payload.memberships?.length) {
        throw new Error(payload?.error?.message ?? "Login failed.")
      }
      setSession({
        token: payload.session.accessToken,
        organizationId: payload.memberships[0]!.organizationId,
        user: payload.user,
        memberships: payload.memberships,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login failed.")
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      error,
      login,
      switchOrganization: (organizationId: string) => {
        setSession((current) => (current ? { ...current, organizationId } : current))
      },
      logout: async () => {
        if (session) {
          try {
            await api("/api/v1/auth/logout", {
              token: session.token,
              organizationId: session.organizationId,
              method: "POST",
              body: {},
            })
          } catch {
            // Logout is best-effort: the server revokes what it can and the
            // client always drops the token.
          }
        }
        setSession(null)
      },
    }),
    [session, error, login]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error("useSession must be used inside SessionProvider.")
  return context
}

export function useAuthenticatedSession(): Session {
  const { session } = useSession()
  if (!session) throw new Error("No active session.")
  return session
}
