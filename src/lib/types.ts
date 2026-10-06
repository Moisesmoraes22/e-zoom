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
  /** Store-reported popularity (Shopee likes / sales); only used to rank, never shown. */
  popularity?: number
  /** Clicks on "Ver oferta" in the last 14 days (only offers with 2+); used to rank, never shown. */
  clicks?: number
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
  /** ISO time the offer was last seen by the collector; shown next to the price. */
  seenAt?: string
  /** ISO time the offer first entered the catalog ("recent offers" ordering). */
  createdAt?: string
  /**
   * Shared by offers of the SAME product in different stores (offers.product_id).
   * Empty today: no collector has a reliable cross-store identifier yet.
   */
  productId?: string
}

export interface ProductOffer {
  store: StoreSource
  price: number
  originalPrice?: number
  affiliateUrl: string
  isFreeShipping?: boolean
}

export type SortOption = "relevance" | "price_asc" | "discount_desc" | "recent" | "unit_price"

export interface Category {
  slug: string
  name: string
  icon: string
  image?: string
}

/** Every recorded price of one offer, oldest first. Recorded by the DB only when the price changes. */
export interface PriceStats {
  points: { price: number; at: string }[]
  min: number
  max: number
  /** Time-weighted: each price counts for as long as it was the current one. */
  average: number
  /** ISO time of the first record, i.e. when we started tracking this offer. */
  since: string
}
