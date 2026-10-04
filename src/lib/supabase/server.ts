import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Server client (Server Components, Route Handlers). Create one per request: it is
 * bound to that request's cookies. Reading cookies makes the caller dynamic, so
 * pages that use it are never served from the shared ISR cache.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component, which cannot write cookies. Safe to
            // ignore: the proxy refreshes the session on the account routes.
          }
        },
      },
    },
  )
}
