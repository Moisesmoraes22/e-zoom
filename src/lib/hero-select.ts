import type { Product } from "@/lib/types"

// Kept free of runtime imports so the selection can be checked with plain `node`.

/** The hero shows at most this many offers. */
export const HERO_MAX = 4
const MAX_PER_STORE = 2
const MAX_PER_CATEGORY = 2
const DAY = 86_400_000

const discountOf = (p: Product) =>
  p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : null

/**
 * Internal ordering only (never shown): how much real price information backs
 * an offer. Every term comes from recorded data; nothing is assumed.
 */
export function heroRank(p: Product, now: number): number {
  const discount = discountOf(p) ?? 0
  const history = p.priceHistory ?? []
  const hasHistory = history.length >= 2
  const atLowest =
    hasHistory && Math.max(...history) > Math.min(...history) && p.price <= Math.min(...history)
  const isRecent = !!p.createdAt && now - Date.parse(p.createdAt) < 2 * DAY

  return (
    (discount > 0 ? 30 : 0) + // real previous price
    (hasHistory ? 25 : 0) + // recorded price history
    (atLowest ? 20 : 0) + // current price is the lowest recorded
    (discount >= 30 ? 15 : 0) +
    (discount >= 50 ? 10 : 0) +
    (isRecent ? 5 : 0)
  )
}

/**
 * Up to HERO_MAX offers for the hero: best-ranked first, then varied.
 * Pass 1 wants a different category per slide (and at most 2 per store, favouring
 * a store not yet shown); pass 2 allows 2 per category; pass 3 drops the caps.
 * Later passes only run if there are too few offers to fill the hero otherwise.
 * Never pads: fewer offers means fewer slides.
 *
 * Candidates need a positive price, a store and an http(s) image (the catalog
 * already holds only active offers with an affiliate link).
 */
export function selectHeroOffers(products: Product[], now = Date.now()): Product[] {
  const pool = products
    .filter((p) => p.price > 0 && p.store && /^https?:\/\//.test(p.image))
    .map((p) => ({ p, score: heroRank(p, now) }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (discountOf(b.p) ?? 0) - (discountOf(a.p) ?? 0) ||
        (b.p.createdAt ?? "").localeCompare(a.p.createdAt ?? ""),
    )

  const picked: Product[] = []
  const stores = new Map<string, number>()
  const categories = new Map<string, number>()
  const count = (m: Map<string, number>, key: string) => m.get(key) ?? 0

  const fill = (maxPerCategory: number, maxPerStore: number) => {
    while (picked.length < HERO_MAX) {
      let best: (typeof pool)[number] | null = null
      let bestAdjusted = -Infinity
      for (const candidate of pool) {
        if (picked.includes(candidate.p)) continue
        const sameStore = count(stores, candidate.p.store)
        if (sameStore >= maxPerStore) continue
        if (count(categories, candidate.p.category) >= maxPerCategory) continue
        const adjusted = candidate.score + (sameStore === 0 ? 12 : 0)
        if (adjusted > bestAdjusted) {
          best = candidate
          bestAdjusted = adjusted
        }
      }
      if (!best) return
      picked.push(best.p)
      stores.set(best.p.store, count(stores, best.p.store) + 1)
      categories.set(best.p.category, count(categories, best.p.category) + 1)
    }
  }

  fill(1, MAX_PER_STORE)
  fill(MAX_PER_CATEGORY, MAX_PER_STORE)
  fill(Infinity, Infinity)
  return picked
}
