export type StoreId = "mercado_livre" | "shopee" | "amazon"

/** A discovered promotion, normalized to the shape of the `offers` table. */
export interface OfferRow {
  store_id: StoreId
  external_id: string
  title: string
  image: string | null
  category_slug: string | null
  price: number
  original_price: number | null
  url: string
  affiliate_url: string | null
  is_free_shipping: boolean
  source: "api" | "telegram" | "manual"
}

export interface Connector {
  name: string
  fetchOffers(): Promise<OfferRow[]>
}
