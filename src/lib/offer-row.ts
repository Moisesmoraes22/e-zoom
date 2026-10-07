import type { Product, StoreSource } from "@/lib/types"

/** A row of `public.offers` as the site reads it (public read, active offers only). */
export interface OfferRow {
  id: string
  store_id: StoreSource
  title: string
  image: string
  category_slug: string | null
  price: number
  original_price: number | null
  affiliate_url: string
  is_free_shipping: boolean
  last_seen_at: string
  created_at: string
  product_id: string | null
  rating: number | null
  popularity: number | null
  seller_state?: string | null
  seller_city?: string | null
}

const credibleOriginalPrice = (price: number, original: number | null) =>
  original && Number(original) > price && price >= Number(original) * (1 - MAX_CREDIBLE_DISCOUNT / 100)
    ? Number(original)
    : undefined

export const OFFER_COLUMNS =
  "id, store_id, title, image, category_slug, price, original_price, affiliate_url, is_free_shipping, last_seen_at, created_at, product_id, rating, popularity"

/**
 * A "previous price" implying more than this much off is not believable (stores, and
 * especially marketplace sellers, inflate list prices: R$ 1.599 for a R$ 266 power
 * supply). Above it we show only the current price, no strikethrough and no badge.
 */
export const MAX_CREDIBLE_DISCOUNT = 50

export const isCredibleDrop = (previous: number, current: number) =>
  current < previous * 0.97 && current >= previous * 0.5

/** `recentPrices`: last recorded prices, oldest first (the catalog passes them; favorites do not). */
export function rowToProduct(row: OfferRow, recentPrices: number[] = []): Product {
  const prices = recentPrices.slice(-8)
  const hasHistory = prices.length >= 2
  return {
    id: row.id,
    title: row.title,
    image: row.image,
    price: Number(row.price),
    originalPrice: credibleOriginalPrice(Number(row.price), row.original_price),
    store: row.store_id,
    category: row.category_slug ?? "outros",
    affiliateUrl: row.affiliate_url,
    isFreeShipping: row.is_free_shipping,
    seenAt: row.last_seen_at,
    createdAt: row.created_at,
    productId: row.product_id ?? undefined,
    rating: row.rating ? Number(row.rating) : undefined,
    popularity: row.popularity ? Number(row.popularity) : undefined,
    sellerState: row.seller_state ?? undefined,
    sellerCity: row.seller_city ?? undefined,
    priceHistory: hasHistory ? prices : undefined,
    // A real drop: 3% to 50% below the previous recorded price. Under 3% is cent-level noise;
    // over 50% is a glitch (a R$ 9.999 placeholder price, or the cheapest seller changing).
    isPriceDrop: hasHistory && isCredibleDrop(prices.at(-2)!, prices.at(-1)!),
  }
}
