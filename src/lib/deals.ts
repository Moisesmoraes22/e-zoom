import { CATEGORIES } from "@/lib/mock-data"
import { heroRank } from "@/lib/hero-select"
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

/** Internal ordering score (never shown): real price signals + store rating + a fresh price. */
export function offerScore(p: Product, now: number) {
  const fresh = p.seenAt && now - Date.parse(p.seenAt) < 86_400_000 ? 8 : 0
  const rated = p.rating ? (p.rating - 4) * 10 : 0
  return heroRank(p, now) + (discountOf(p) ?? 0) * 0.3 + rated + fresh
}

/**
 * Best first, without one store taking over. Each store is ranked by score on its own
 * and the lists are merged by relative position (top 10% of each store together), so
 * a big catalog does not bury a small one and stores appear in proportion to size.
 */
export function byRelevance(products: Product[], now = Date.now()) {
  const stores = new Map<string, { p: Product; score: number }[]>()
  for (const p of products) {
    const list = stores.get(p.store) ?? []
    list.push({ p, score: offerScore(p, now) })
    stores.set(p.store, list)
  }
  const merged: { p: Product; score: number; pos: number }[] = []
  for (const list of stores.values()) {
    list.sort((a, b) => b.score - a.score)
    list.forEach((e, i) => merged.push({ ...e, pos: (i + 0.5) / list.length }))
  }
  return merged.sort((a, b) => a.pos - b.pos || b.score - a.score).map((e) => e.p)
}

/** Keeps at most `max` offers of each category, preserving order. */
export function capPerCategory(products: Product[], max: number) {
  const seen = new Map<string, number>()
  return products.filter((p) => {
    const n = seen.get(p.category) ?? 0
    seen.set(p.category, n + 1)
    return n < max
  })
}

export const byRecent =(products: Product[]) =>
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
