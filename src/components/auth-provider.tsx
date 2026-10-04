"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { createClient } from "@/lib/supabase/client"

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
}

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: AuthUser }

const AuthContext = createContext<AuthState & { signOut: () => Promise<void> }>({
  status: "loading",
  user: null,
  signOut: async () => {},
})

/**
 * Who is signed in, for the UI only (header, favorites sync). It never grants anything:
 * what a user can read or change is enforced by RLS in the database and by getClaims()
 * on the server. Public pages stay static; this fills in after the page loads.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null })

  useEffect(() => {
    const supabase = createClient()
    // Fires once with the stored session, then on sign in, sign out, token refresh and
    // expiry. Only state is set here: calling Supabase from this callback can deadlock.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setState(
        user
          ? {
              status: "authenticated",
              user: {
                id: user.id,
                email: user.email ?? null,
                name: (user.user_metadata?.full_name as string | undefined) ?? null,
              },
            }
          : { status: "anonymous", user: null },
      )
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    // Revokes the refresh token and clears the session cookies; the listener above then
    // flips the UI back to visitor.
    await createClient().auth.signOut()
  }, [])

  const value = useMemo(() => ({ ...state, signOut }), [state, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
