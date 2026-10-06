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
  /** Store rating, 0-5. Only set by sources that really have it (Shopee). */
  rating?: number | null
  /**
   * When this price was really seen, if not now (Telegram: the post's date, since the
   * collector re-reads old posts). Becomes `last_seen_at`; defaults to the run time.
   */
  seen_at?: string
}

export interface Connector {
  name: string
  fetchOffers(): Promise<OfferRow[]>
}
