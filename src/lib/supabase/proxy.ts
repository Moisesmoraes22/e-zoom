import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Refreshes the Supabase session for the account routes and guards /conta.
 * getClaims() verifies the JWT signature against the project's public keys, so the
 * result can be trusted (unlike getSession(), which just echoes the cookie).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
          // Cache-Control & co: keeps a CDN from caching a response that carries a session.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  // Nothing may run between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims()

  // These routes are session-bound: never let a shared cache keep them (Supabase's own
  // cache headers, set above when cookies change, win if present).
  if (!response.headers.has("Cache-Control")) response.headers.set("Cache-Control", "private, no-store")

  if (!data?.claims && request.nextUrl.pathname.startsWith("/conta")) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("next", "/conta")
    const redirect = NextResponse.redirect(url)
    // Keep any cookie the refresh attempt set or cleared, so a dead session is not retried forever.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    redirect.headers.set("Cache-Control", response.headers.get("Cache-Control") ?? "private, no-store")
    return redirect
  }

  return response
}
