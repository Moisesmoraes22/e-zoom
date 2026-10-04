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

export const byRecent = (products: Product[]) =>
  [...products].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))

export function countByStoreId(products: Product[]) {
  const counts: Record<string, number> = {}
  for (const p of products) counts[p.store] = (counts[p.store] ?? 0) + 1
  return counts
}
