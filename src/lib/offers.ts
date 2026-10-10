import { createClient } from "@supabase/supabase-js"
import { cache } from "react"

import { withVariants } from "@/lib/deals"
import { ALL_PRODUCTS } from "@/lib/mock-data"
import { isCredibleDrop, OFFER_COLUMNS, rowToProduct, type OfferRow } from "@/lib/offer-row"
import type { PriceStats, Product } from "@/lib/types"

/**
 * Safety ceiling for the public catalog. The cut drops the offers seen LEAST recently (the
 * Amazon ones, which only come from Telegram), so it must stay well above the live count
 * (9,7k today): at 6,000 the site silently hid the whole Amazon store.
 */
const MAX_OFFERS = 15_000
/** Same idea for price_history (14k rows today, growing with every price change). */
const MAX_HISTORY_ROWS = 40_000

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
  const history: { offer_id: string; price: number; recorded_at: string }[] = []
  for (let from = 0; from < MAX_HISTORY_ROWS; from += 1000) {
    const { data: page } = await supabase
      .from("price_history")
      .select("offer_id, price, recorded_at")
      .order("recorded_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + 999)
    history.push(...(page ?? []))
    if ((page?.length ?? 0) < 1000) break
  }
  const pricesByOffer = new Map<string, number[]>()
  const dropAtByOffer = new Map<string, string>() // when the latest change was a drop (>= 3%)
  for (const row of history.reverse()) {
    const list = pricesByOffer.get(row.offer_id) ?? []
    const price = Number(row.price)
    if (list.length > 0 && isCredibleDrop(list.at(-1)!, price)) dropAtByOffer.set(row.offer_id, row.recorded_at)
    else if (list.length > 0) dropAtByOffer.delete(row.offer_id) // a later rise or flat change ends the drop
    list.push(price)
    pricesByOffer.set(row.offer_id, list)
  }

  // Click totals (counts only) feed the ranking; if the call fails the site just ranks without them.
  const { data: clickRows } = await supabase.rpc("offer_click_counts", { days: 14 })
  const clicksByOffer = new Map<string, number>(
    ((clickRows ?? []) as { offer_id: string; clicks: number }[]).map((r) => [r.offer_id, r.clicks]),
  )

  const products = (data as OfferRow[]).map((row) => ({
    ...rowToProduct(row, pricesByOffer.get(row.id)),
    clicks: clicksByOffer.get(row.id),
    dropAt: dropAtByOffer.get(row.id),
  }))
  // Unset fields are dropped, not sent as "$undefined": ~80k of them were ~25% of the /busca payload.
  return { products: withVariants(products).map(withoutUndefined), live: true }
})

const withoutUndefined = <T extends object>(item: T): T =>
  Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined)) as T

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

/**
 * Every photo of one offer (cover first), for the product page. Read apart from the catalog so the
 * lists do not carry several URLs per offer. Falls back to the cover alone while the offer has no
 * extra photos (or the column is not there yet).
 */
export const getOfferImages = cache(async (offerId: string, cover: string): Promise<string[]> => {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return [cover]

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  const { data } = await supabase.from("offers").select("images").eq("id", offerId).maybeSingle()
  const extra = Array.isArray(data?.images) ? (data.images as unknown[]).filter((u): u is string => typeof u === "string" && /^https:\/\//.test(u)) : []
  return [...new Set([cover, ...extra])].slice(0, 8)
})
