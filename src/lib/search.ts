import type { Product, SortOption, StoreSource } from "@/lib/types"
import { calculateDiscountPercent } from "@/lib/utils"

export type PriceRange = "0-500" | "500-1000" | "1000-2000" | "2000+"

export interface ProductFilters {
  query?: string
  category?: string
  stores: StoreSource[]
  priceRanges: PriceRange[]
  minDiscount: number | null
  minRating: number | null
  freeShippingOnly: boolean
}

export const EMPTY_FILTERS: ProductFilters = {
  stores: [],
  priceRanges: [],
  minDiscount: null,
  minRating: null,
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
  const query = filters.query?.trim().toLowerCase()

  return products.filter((product) => {
    if (query && !product.title.toLowerCase().includes(query)) return false
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
    if (filters.minRating && (product.rating ?? 0) < filters.minRating)
      return false
    if (filters.freeShippingOnly && !product.isFreeShipping) return false
    return true
  })
}

export function sortProducts(products: Product[], sort: SortOption) {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price)
    case "discount_desc":
      return sorted.sort(
        (a, b) =>
          (calculateDiscountPercent(b.price, b.originalPrice) ?? 0) -
          (calculateDiscountPercent(a.price, a.originalPrice) ?? 0),
      )
    case "rating_desc":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    case "recent":
      return sorted.reverse()
    case "relevance":
    default:
      return sorted
  }
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
