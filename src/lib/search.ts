import type { Product, SortOption, StoreSource } from "@/lib/types"
import { calculateDiscountPercent } from "@/lib/utils"

/** Lowercase without accents, so "relogio" finds "Relógio". */
export const normalizeText = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

export type PriceRange = "0-500" | "500-1000" | "1000-2000" | "2000+"

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

function matchesPriceRange(price: number, range: PriceRange) {
  switch (range) {
    case "0-500":
      return price <= 500
    case "500-1000":
      return price > 500 && price <= 1000
    case "1000-2000":
      return price > 1000 && price <= 2000
    case "2000+":
      return price > 2000
  }
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
      // Offers with a real discount first (biggest first); the rest keep catalog order.
      return sorted.sort((a, b) => discountOf(b) - discountOf(a))
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
