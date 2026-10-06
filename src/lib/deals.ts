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

const FRESHNESS_HALF_LIFE_H = 48
const MIN_CLICKS = 3

/** 1 = price seen just now, 0.5 after 48h, 0.25 after 96h. Unknown age counts as old. */
export function freshness(p: Product, now: number) {
  const seen = Date.parse(p.seenAt ?? p.createdAt ?? "")
  if (Number.isNaN(seen)) return 0.3
  return 0.5 ** (Math.max(0, now - seen) / (FRESHNESS_HALF_LIFE_H * 3_600_000))
}

/** Internal ordering score (never shown): real price signals + store rating, weighed by how recent the price is. */
export function offerScore(p: Product, now: number) {
  const rated = p.rating ? (p.rating - 4) * 10 : 0
  const popular = p.popularity ? Math.log10(1 + p.popularity) * 4 : 0 // 10 -> ~4, 10,000 -> ~16
  // Real interest from our own visitors. Ignored below MIN_CLICKS (a couple of clicks is noise)
  // and capped, so already-popular offers cannot snowball by being shown more.
  const clicked = p.clicks && p.clicks >= MIN_CLICKS ? Math.min(12, Math.log2(p.clicks) * 3) : 0
  const signals = Math.max(0, heroRank(p, now) + (discountOf(p) ?? 0) * 0.3 + rated + popular + clicked)
  return signals * (0.3 + 0.7 * freshness(p, now))
}

/**
 * Best first, without one store taking over. Each store is ranked on its own and the
 * lists are merged by position, so a big catalog does not bury a small one. A store's
 * share grows with the square root of its size (not linearly) and with how recent its
 * prices are on average: fresh data earns more room, a stale snapshot less.
 */
export function byRelevance(products: Product[], now = Date.now()) {
  const stores = new Map<string, { p: Product; score: number }[]>()
  for (const p of products) {
    const list = stores.get(p.store) ?? []
    list.push({ p, score: offerScore(p, now) })
    stores.set(p.store, list)
  }
  const merged: { p: Product; score: number; key: number }[] = []
  for (const list of stores.values()) {
    list.sort((a, b) => b.score - a.score)
    const weight = Math.max(0.25, list.reduce((sum, e) => sum + freshness(e.p, now), 0) / list.length)
    list.forEach((e, i) => merged.push({ ...e, key: (i + 0.5) / Math.sqrt(list.length) / weight }))
  }
  const ranked = merged.sort((a, b) => a.key - b.key || b.score - a.score).map((e) => e.p)
  // Other flavours / sellers of a product already listed go after everything else:
  // still reachable, but a shelf never shows the same product three times.
  const seen = new Set<string>()
  const first: Product[] = []
  const repeats: Product[] = []
  for (const p of ranked) {
    const key = variantKey(p.title)
    ;(seen.has(key) ? repeats : first).push(p)
    seen.add(key)
  }
  return [...first, ...repeats]
}

/** Same product ignoring flavour: accents, spaces and everything from "sabor" on are dropped. */
const variantKey = (title: string) =>
  title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/sabor.*$/, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 32)

/** Highlight candidates: a real discount, or a price seen within about a day (so Amazon posts qualify too). */
export const byFeatured = (products: Product[], now = Date.now()) =>
  byRelevance(products.filter((p) => discountOf(p) || freshness(p, now) >= 0.7), now)

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
