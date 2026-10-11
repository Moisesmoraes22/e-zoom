import { createClient } from "@supabase/supabase-js"

import { clientIp, rateLimiter } from "@/lib/rate-limit"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|headless|preview|lighthouse/i
const allowed = rateLimiter(30)

/**
 * Records a view of a product page and answers with how many views it had in the last 24 h
 * ({ n }). Offer id + time only; the database function caps the volume. Bots get n = 0 and are not
 * counted.
 */
export async function POST(request: Request) {
  const none = Response.json({ n: 0 })
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return none
  if (BOT.test(request.headers.get("user-agent") ?? "")) return none

  const body = (await request.json().catch(() => null)) as { offerId?: unknown } | null
  const offerId = body?.offerId
  if (typeof offerId !== "string" || !UUID.test(offerId)) return none
  if (!allowed(clientIp(request))) return none

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  const { data } = await supabase.rpc("record_view", { p_offer: offerId })
  return Response.json({ n: typeof data === "number" ? data : 0 })
}
