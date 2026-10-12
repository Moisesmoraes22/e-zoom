import { createClient } from "@supabase/supabase-js"

/**
 * Open counts (14 days) of the offers opened at least twice, as { [offerId]: n }. The pages are cached
 * for 30 minutes; the fire badge reads this instead, so it shows up within about a minute of the
 * click. Counts only, no visitor data. The CDN keeps one answer for 20 s, so the database is asked
 * a few times a minute at most, however many people are on the site.
 */
export async function GET() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  const headers = { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return Response.json({}, { headers })

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  const { data, error } = await supabase.rpc("offer_click_counts", { days: 14 })
  // On failure nothing is cached: the page keeps the numbers it already has and asks again later.
  if (error || !Array.isArray(data)) return Response.json({}, { status: 503 })

  const hot: Record<string, number> = {}
  for (const row of data as { offer_id: string; clicks: number }[]) if (row.clicks >= 2) hot[row.offer_id] = row.clicks
  return Response.json(hot, { headers })
}
