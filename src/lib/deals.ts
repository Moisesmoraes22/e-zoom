import { CATEGORIES } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import { calculateDiscountPercent } from "@/lib/utils"

export interface CategoryCount {
  slug: string
  name: string
  image?: string
  count: number
}

/** Known categories that have at least one offer right now, biggest first. */
export function categoryCounts(products: Product[]): CategoryCount[] {
  const counts = new Map<string, number>()
  for (const p of products) counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  return CATEGORIES.map((c) => ({
    slug: c.slug,
    name: c.name,
    image: c.image,
    count: counts.get(c.slug) ?? 0,
  }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
}

export const discountOf = (p: Product) =>
  calculateDiscountPercent(p.price, p.originalPrice)

/** How much cheaper than the recorded previous price, in R$. Null when there is none. */
export const savingsOf = (p: Product) =>
  p.originalPrice && p.originalPrice > p.price ? p.originalPrice - p.price : null

export const byDiscount = (products: Product[]) =>
  products
    .filter((p) => discountOf(p))
    .sort((a, b) => (discountOf(b) ?? 0) - (discountOf(a) ?? 0))

/** Real drops only (from recorded prices), biggest percentage first. Same figure the card shows. */
export const byPriceDrop = (products: Product[]) =>
  products
    .filter((p) => p.isPriceDrop && p.priceHistory)
    .sort(
      (a, b) =>
        (calculateDiscountPercent(b.price, Math.max(...b.priceHistory!)) ?? 0) -
        (calculateDiscountPercent(a.price, Math.max(...a.priceHistory!)) ?? 0),
    )

const FIND_MIN_RATING = 4.8
const FIND_DISCOUNT = [20, 50] as const // above ~50% the "previous price" is rarely credible
const FIND_PER_CATEGORY = 2

/**
 * Curated picks from real signals only: a store rating of 4.8+ (recorded only with
 * enough likes behind it) and a store-declared discount of 20-50%. Best-rated first,
 * at most two per category so the section is not one kind of product.
 */
export const byFinds = (products: Product[]) => {
  const perCategory = new Map<string, number>()
  return products
    .filter((p) => {
      const discount = discountOf(p) ?? 0
      return (p.rating ?? 0) >= FIND_MIN_RATING && discount >= FIND_DISCOUNT[0] && discount <= FIND_DISCOUNT[1]
    })
    .sort((a, b) => b.rating! - a.rating! || (discountOf(b) ?? 0) - (discountOf(a) ?? 0))
    .filter((p) => {
      const n = perCategory.get(p.category) ?? 0
      perCategory.set(p.category, n + 1)
      return n < FIND_PER_CATEGORY
    })
}

export const byRecent = (products: Product[]) =>
  [...products].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))

export function countByStoreId(products: Product[]) {
  const counts: Record<string, number> = {}
  for (const p of products) counts[p.store] = (counts[p.store] ?? 0) + 1
  return counts
}

/** Same-category offers, closest in price first (what someone viewing this product would compare). */
export function sameCategory(product: Product, products: Product[], limit = 8) {
  const gap = (p: Product) => Math.abs(Math.log(p.price / product.price))
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => gap(a) - gap(b))
    .slice(0, limit)
}
