import { byRelevance } from "@/lib/deals"
import type { Product, SortOption, StoreSource } from "@/lib/types"
import { calculateDiscountPercent } from "@/lib/utils"

/** Lowercase without accents, so "relogio" finds "Relógio". */
export const normalizeText = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

/** Price buckets shared by the filter panel, the filter chips and the home section. */
export const PRICE_RANGES = [
  { value: "0-50", label: "Até R$ 50", min: 0, max: 50 },
  { value: "50-100", label: "R$ 50 a R$ 100", min: 50, max: 100 },
  { value: "100-300", label: "R$ 100 a R$ 300", min: 100, max: 300 },
  { value: "300-1000", label: "R$ 300 a R$ 1.000", min: 300, max: 1000 },
  { value: "1000+", label: "Acima de R$ 1.000", min: 1000, max: Infinity },
] as const

export type PriceRange = (typeof PRICE_RANGES)[number]["value"]

export const isPriceRange = (value: string): value is PriceRange =>
  PRICE_RANGES.some((range) => range.value === value)

export interface ProductFilters {
  query?: string
  category?: string
  stores: StoreSource[]
  priceRanges: PriceRange[]
  minDiscount: number | null
  freeShippingOnly: boolean
}

export const EMPTY_FILTERS: ProductFilters = {
  category: undefined,
  stores: [],
  priceRanges: [],
  minDiscount: null,
  freeShippingOnly: false,
}

function matchesPriceRange(price: number, value: PriceRange) {
  const range = PRICE_RANGES.find((r) => r.value === value)!
  return price > range.min && price <= range.max
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  const tokens = normalizeText(filters.query ?? "").split(/\s+/).filter(Boolean)

  return products.filter((product) => {
    if (tokens.length) {
      const title = normalizeText(product.title)
      if (!tokens.every((token) => title.includes(token))) return false
    }
    if (filters.category && product.category !== filters.category)
      return false
    if (filters.stores.length && !filters.stores.includes(product.store))
      return false
    if (
      filters.priceRanges.length &&
      !filters.priceRanges.some((range) =>
        matchesPriceRange(product.price, range),
      )
    )
      return false
    if (filters.minDiscount) {
      const discount = calculateDiscountPercent(
        product.price,
        product.originalPrice,
      )
      if (!discount || discount < filters.minDiscount) return false
    }
    if (filters.freeShippingOnly && !product.isFreeShipping) return false
    return true
  })
}

/** Real discount only: products without a recorded previous price count as 0. */
const discountOf = (p: Product) =>
  calculateDiscountPercent(p.price, p.originalPrice) ?? 0

export function sortProducts(products: Product[], sort: SortOption) {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price)
    case "discount_desc":
      return sorted.sort((a, b) => discountOf(b) - discountOf(a))
    case "recent":
      // Newest in the catalog first; items without a date keep their order.
      return sorted.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    case "relevance":
    default:
      return byRelevance(sorted)
  }
}

/** URL values for `?ordenacao=` (Portuguese, stable, so they can become pages later). */
export const SORT_PARAMS: Record<string, SortOption> = {
  relevancia: "relevance",
  desconto: "discount_desc",
  preco: "price_asc",
  recente: "recent",
}

export function countByStore(products: Product[]) {
  return products.reduce(
    (acc, product) => {
      acc[product.store] = (acc[product.store] ?? 0) + 1
      return acc
    },
    {} as Record<StoreSource, number>,
  )
}

/** How many offers fall in each price bucket (all of them, regardless of other filters). */
export function countByPriceRange(products: Product[]) {
  return PRICE_RANGES.map((range) => ({
    ...range,
    count: products.filter((p) => matchesPriceRange(p.price, range.value)).length,
  }))
}
