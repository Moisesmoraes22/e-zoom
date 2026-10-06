import { createClient } from "@supabase/supabase-js"

const ORIGINS = new Set(["home", "busca", "categoria", "produto", "outro"])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BOT = /bot|crawl|spider|headless|preview|lighthouse/i

/**
 * Records a click on "Ver oferta" (offer id + site area + time; nothing about the visitor).
 * Always answers 204: the visitor is already leaving for the store, and a rejected
 * click must not reveal why. Bots are not counted.
 */
export async function POST(request: Request) {
  const done = new Response(null, { status: 204 })
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return done
  if (BOT.test(request.headers.get("user-agent") ?? "")) return done

  const body = (await request.json().catch(() => null)) as { offerId?: unknown; origin?: unknown } | null
  const { offerId, origin } = body ?? {}
  if (typeof offerId !== "string" || !UUID.test(offerId)) return done

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  })
  await supabase.from("offer_clicks").insert({
    offer_id: offerId,
    origin: typeof origin === "string" && ORIGINS.has(origin) ? origin : "outro",
  })
  return done
}
