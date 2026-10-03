import { createClient } from "@supabase/supabase-js"

import { ALL_PRODUCTS } from "@/lib/mock-data"
import type { Product, StoreSource } from "@/lib/types"

interface OfferRow {
  id: string
  store_id: StoreSource
  title: string
  image: string
  category_slug: string | null
  price: number
  original_price: number | null
  affiliate_url: string
  is_free_shipping: boolean
}

/**
 * Live offers from Supabase (public read via RLS). Only offers with OUR
 * affiliate link and an image are shown. Falls back to the mock catalog
 * while the database is empty or unreachable, so the site never goes blank.
 */
export async function getCatalog(): Promise<{ products: Product[]; live: boolean }> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return mockCatalog()

  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  })
  const { data, error } = await supabase
    .from("offers")
    .select(
      "id, store_id, title, image, category_slug, price, original_price, affiliate_url, is_free_shipping",
    )
    .eq("is_active", true)
    .not("affiliate_url", "is", null)
    .not("image", "is", null)
    .order("last_seen_at", { ascending: false })
    .limit(500)

  if (error || !data?.length) return mockCatalog()

  // The DB trigger only records a row when the price changes. Newest 1000 rows
  // (PostgREST's page cap), re-ordered oldest-first per offer below.
  const { data: history } = await supabase
    .from("price_history")
    .select("offer_id, price")
    .order("recorded_at", { ascending: false })
    .limit(1000)
  const pricesByOffer = new Map<string, number[]>()
  for (const row of [...(history ?? [])].reverse()) {
    const list = pricesByOffer.get(row.offer_id) ?? []
    list.push(Number(row.price))
    pricesByOffer.set(row.offer_id, list)
  }

  const products = (data as OfferRow[]).map((row): Product => {
    const prices = (pricesByOffer.get(row.id) ?? []).slice(-8)
    const hasHistory = prices.length >= 2
    return {
      id: row.id,
      title: row.title,
      image: row.image,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : undefined,
      store: row.store_id,
      category: row.category_slug ?? "outros",
      affiliateUrl: row.affiliate_url,
      isFreeShipping: row.is_free_shipping,
      priceHistory: hasHistory ? prices : undefined,
      // A real drop: at least 3% below the previous recorded price (ignores cent-level noise).
      isPriceDrop: hasHistory && prices.at(-1)! < prices.at(-2)! * 0.97,
    }
  })
  return { products, live: true }
}

function mockCatalog() {
  return { products: ALL_PRODUCTS, live: false }
}
