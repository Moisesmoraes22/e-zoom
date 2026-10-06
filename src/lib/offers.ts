import { createClient } from "@supabase/supabase-js"
import { cache } from "react"

import { ALL_PRODUCTS } from "@/lib/mock-data"
import { OFFER_COLUMNS, rowToProduct, type OfferRow } from "@/lib/offer-row"
import type { PriceStats, Product } from "@/lib/types"

/** Safety ceiling for the public catalog (the engine keeps ~1,300 offers live). */
const MAX_OFFERS = 3000
/** Same idea for price_history (3.5k rows today, growing with every price change). */
const MAX_HISTORY_ROWS = 20_000

/**
 * Live offers from Supabase (public read via RLS). Only offers with OUR
 * affiliate link and an image are shown. Falls back to the mock catalog
 * while the database is empty or unreachable, so the site never goes blank.
 * Memoised per request, so the layout and the page share one query.
 */
export const getCatalog = cache(async (): Promise<{ products: Product[]; live: boolean }> => {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return mockCatalog()

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  })
  // PostgREST returns at most 1000 rows per request: read pages until the end.
  const data: unknown[] = []
  for (let from = 0; from < MAX_OFFERS; from += 1000) {
    const { data: page, error } = await supabase
      .from("offers")
      .select(OFFER_COLUMNS)
      .eq("is_active", true)
      .not("affiliate_url", "is", null)
      .not("image", "is", null)
      .order("last_seen_at", { ascending: false })
      .order("id")
      .range(from, from + 999)
    if (error) return mockCatalog()
    data.push(...page)
    if (page.length < 1000) break
  }

  if (!data.length) return mockCatalog()

  // The DB trigger only records a row when the price changes (plus one first row per
  // offer). Read it all, page by page (PostgREST caps a request at 1000 rows), so the
  // drops are not hidden behind thousands of first-price rows. Oldest-first per offer below.
  const history: { offer_id: string; price: number }[] = []
  for (let from = 0; from < MAX_HISTORY_ROWS; from += 1000) {
    const { data: page } = await supabase
      .from("price_history")
      .select("offer_id, price")
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + 999)
    history.push(...(page ?? []))
    if ((page?.length ?? 0) < 1000) break
  }
  const pricesByOffer = new Map<string, number[]>()
  for (const row of history.reverse()) {
    const list = pricesByOffer.get(row.offer_id) ?? []
    list.push(Number(row.price))
    pricesByOffer.set(row.offer_id, list)
  }

  const products = (data as OfferRow[]).map((row) =>
    rowToProduct(row, pricesByOffer.get(row.id)),
  )
  return { products, live: true }
})

function mockCatalog() {
  return { products: ALL_PRODUCTS, live: false }
}

/**
 * Full recorded price history of one offer (product page only; the catalog just
 * carries the last few prices). Null when nothing was recorded yet.
 */
export const getPriceStats = cache(async (offerId: string): Promise<PriceStats | null> => {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  })
  const { data } = await supabase
    .from("price_history")
    .select("price, recorded_at")
    .eq("offer_id", offerId)
    .order("recorded_at", { ascending: true })
    .limit(1000)
  if (!data?.length) return null

  const points = data.map((row) => ({ price: Number(row.price), at: row.recorded_at as string }))
  const now = Date.now()
  let weighted = 0
  let span = 0
  points.forEach((point, i) => {
    const end = i + 1 < points.length ? new Date(points[i + 1].at).getTime() : now
    const duration = Math.max(0, end - new Date(point.at).getTime())
    weighted += point.price * duration
    span += duration
  })
  const prices = points.map((p) => p.price)
  return {
    points,
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: span > 0 ? weighted / span : prices.reduce((a, b) => a + b, 0) / prices.length,
    since: points[0].at,
  }
})
