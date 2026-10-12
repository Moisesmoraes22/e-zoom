"use client"

import { usePathname } from "next/navigation"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"

import { safeAvatarUrl } from "@/lib/avatar"
import { hasSessionCookie, supabaseConfigured } from "@/lib/supabase/config"

// The Supabase browser library is about 90 KB gzipped, so a visitor without a stored session never
// downloads it: it is imported only when the session cookie exists (or after a sign in, see below).
const loadClient = () => import("@/lib/supabase/client").then((m) => m.createClient())

export interface AuthUser {
  id: string
  email: string | null
  name: string | null
  /** Profile photo (our avatars bucket only), or null. */
  avatarUrl: string | null
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
  // Without the public Supabase variables the site simply behaves as visitor-only.
  const [state, setState] = useState<AuthState>({
    status: supabaseConfigured ? "loading" : "anonymous",
    user: null,
  })
  const pathname = usePathname()
  const unsubscribe = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!supabaseConfigured || unsubscribe.current) return
    // No stored session: a visitor, with nothing to download. Checked again on each page, because a
    // sign in (which sets the cookie) happens without reloading the layout.
    if (!hasSessionCookie()) {
      setState((s) => (s.status === "anonymous" ? s : { status: "anonymous", user: null }))
      return
    }
    let cancelled = false
    void loadClient().then((supabase) => {
      if (cancelled || unsubscribe.current) return
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
                  avatarUrl: safeAvatarUrl(user.user_metadata?.avatar_url),
                },
              }
            : { status: "anonymous", user: null },
        )
      })
      unsubscribe.current = () => data.subscription.unsubscribe()
    })
    return () => {
      cancelled = true
    }
  }, [pathname])

  useEffect(() => () => unsubscribe.current?.(), [])

  const signOut = useCallback(async () => {
    // Revokes the refresh token and clears the session cookies; the listener above then
    // flips the UI back to visitor.
    await (await loadClient()).auth.signOut()
  }, [])

  const value = useMemo(() => ({ ...state, signOut }), [state, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
