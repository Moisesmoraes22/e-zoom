import type { Product } from "@/lib/types"

/** The Mercado Livre seller badge, in the words the marketplace uses. */
export const SELLER_LEADER_LABEL: Record<NonNullable<Product["sellerLeader"]>, string> = {
  silver: "MercadoLíder",
  gold: "MercadoLíder Gold",
  platinum: "MercadoLíder Platinum",
}
