import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser client (Client Components only). Uses the publishable key; everything it can
 * read or write is limited by RLS. @supabase/ssr keeps the session in cookies and
 * returns a singleton, so calling this from many components is fine.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
