import { discountOf } from "@/lib/deals"
import { STORES } from "@/lib/mock-data"
import type { PriceStats, Product } from "@/lib/types"
import { formatDay } from "@/lib/utils"

/** What the home hero shows about one real offer. Plain data, safe to pass to a client component. */
export interface HeroOffer {
  id: string
  title: string
  image: string
  price: number
  originalPrice?: number
  /** Real discount in %, only when a previous price is recorded. */
  discount: number | null
  store: string
  storeColor: string
  /** Last recorded prices (oldest first) for the mini chart; only with 2+ records. */
  priceHistory?: number[]
  /** A history claim the data supports, or null (then nothing is shown). */
  insight: string | null
}

const DAY = 86_400_000

/**
 * Only claims what the recorded history proves. With a week or more of
 * records the lowest price can be stated as "melhor preço em N dias"; with less
 * it says exactly since when we have been tracking.
 */
export function heroInsight(product: Product, stats: PriceStats | null): string | null {
  if (!stats || stats.points.length < 2 || stats.max <= stats.min) return null
  if (product.price > stats.min) return null

  const days = Math.floor((Date.now() - new Date(stats.since).getTime()) / DAY)
  return days >= 7
    ? `Melhor preço em ${days} dias`
    : `Menor preço registrado desde ${formatDay(stats.since)}`
}

export function toHeroOffer(product: Product, stats: PriceStats | null): HeroOffer {
  const store = STORES[product.store]
  return {
    id: product.id,
    title: product.title,
    image: product.image,
    price: product.price,
    originalPrice: discountOf(product) ? product.originalPrice : undefined,
    discount: discountOf(product),
    store: store.name,
    storeColor: store.color,
    priceHistory: product.priceHistory,
    insight: heroInsight(product, stats),
  }
}
