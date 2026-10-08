/**
 * Seller badge as the store itself reports it, never guessed: Mercado Livre "MercadoLíder"
 * (silver/gold/platinum) or the Shopee shop type (official store / preferred seller).
 */
export type SellerLeader = "silver" | "gold" | "platinum" | "official" | "preferred"

const LEADERS: readonly string[] = ["silver", "gold", "platinum"]

interface MlUser {
  seller_reputation?: { power_seller_status?: string | null } | null
}

/** `GET /users/{id}` -> the badge, or null when the seller has none (or the answer has no reputation). */
export function mlSellerLeader(user: MlUser | null | undefined): SellerLeader | null {
  const status = user?.seller_reputation?.power_seller_status
  return typeof status === "string" && LEADERS.includes(status) ? (status as SellerLeader) : null
}

/**
 * Shopee Open API `shopType`: a list with 1 (Shopee Mall, an official store), 2 (Preferred) or
 * 4 (Preferred Plus). Empty or unknown means an ordinary shop: no badge.
 */
export function shopeeShopBadge(shopType: unknown): SellerLeader | null {
  const types = Array.isArray(shopType) ? shopType : []
  if (types.includes(1)) return "official"
  if (types.includes(2) || types.includes(4)) return "preferred"
  return null
}
