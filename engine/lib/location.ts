/** Where the seller of an offer ships from, as the marketplace reports it. Never guessed. */
export interface SellerLocation {
  state: string | null
  city: string | null
}

interface MlAddress {
  city?: { name?: string | null } | null
  state?: { name?: string | null } | null
}

const clean = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null)

/** Mercado Livre `seller_address` -> state and city, each null when missing or blank. */
export function mlSellerLocation(address: MlAddress | null | undefined): SellerLocation {
  return { state: clean(address?.state?.name), city: clean(address?.city?.name) }
}
