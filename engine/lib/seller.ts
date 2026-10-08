/** Mercado Livre "MercadoLíder" badge of a seller, as the marketplace reports it. Never guessed. */
export type SellerLeader = "silver" | "gold" | "platinum"

const LEADERS: readonly string[] = ["silver", "gold", "platinum"]

interface MlUser {
  seller_reputation?: { power_seller_status?: string | null } | null
}

/** `GET /users/{id}` -> the badge, or null when the seller has none (or the answer has no reputation). */
export function mlSellerLeader(user: MlUser | null | undefined): SellerLeader | null {
  const status = user?.seller_reputation?.power_seller_status
  return typeof status === "string" && LEADERS.includes(status) ? (status as SellerLeader) : null
}
