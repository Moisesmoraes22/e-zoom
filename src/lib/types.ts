export type StoreSource = "mercado_livre" | "shopee" | "amazon" | "telegram"

export interface Store {
  id: StoreSource
  name: string
  color: string
}

export interface Product {
  id: string
  title: string
  image: string
  price: number
  originalPrice?: number
  installments?: {
    count: number
    value: number
  }
  rating?: number
  reviewsCount?: number
  store: StoreSource
  category: string
  affiliateUrl: string
  isFreeShipping?: boolean
  isSponsored?: boolean
  discountLabel?: string
  /** Product dropped in price recently (used by the "Preço caiu" section). */
  isPriceDrop?: boolean
  /** Last few recorded prices, oldest first. Optional — only for products with tracked history. */
  priceHistory?: number[]
}

export interface ProductOffer {
  store: StoreSource
  price: number
  originalPrice?: number
  affiliateUrl: string
  isFreeShipping?: boolean
}

export type SortOption =
  | "relevance"
  | "price_asc"
  | "discount_desc"
  | "rating_desc"
  | "recent"

export interface Category {
  slug: string
  name: string
  icon: string
  image?: string
}
