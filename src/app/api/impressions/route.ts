import { createClient } from "@supabase/supabase-js"

import { SHELF_NAME } from "@/lib/impressions"
import { clientIp, rateLimiter } from "@/lib/rate-limit"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|headless|preview|lighthouse/i
const MAX_ITEMS = 60
// A visitor scrolling a long page sends a batch every few seconds; a script sends hundreds.
const allowed = rateLimiter(40)

/**
 * Exibições in batches: offer + list + position range, nothing about the visitor (see lib/impressions).
 * Always answers 204: a rejected batch must not reveal why. The database function adds them up per day.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 })
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return done
  if (BOT.test(request.headers.get("user-agent") ?? "")) return done
  if (!allowed(clientIp(request))) return done

  const body = (await request.json().catch(() => null)) as { items?: unknown } | null
  const items = (Array.isArray(body?.items) ? body.items : [])
    .slice(0, MAX_ITEMS)
    .filter(
      (i): i is { o: string; s: string; p: number } =>
        !!i &&
        typeof i.o === "string" &&
        UUID.test(i.o) &&
        typeof i.s === "string" &&
        SHELF_NAME.test(i.s) &&
        Number.isInteger(i.p) &&
        i.p >= 0 &&
        i.p <= 17,
    )
  if (items.length === 0) return done

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  await supabase.rpc("record_impressions", { p_items: items.map(({ o, s, p }) => ({ o, s, p })) })
  return done
}
