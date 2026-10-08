import type { Product } from "@/lib/types"

/** The seller badge, in the words each store uses (MercadoLíder at Mercado Livre; Shopee's official and preferred shops). */
export const SELLER_LEADER_LABEL: Record<NonNullable<Product["sellerLeader"]>, string> = {
  silver: "MercadoLíder",
  gold: "MercadoLíder Gold",
  platinum: "MercadoLíder Platinum",
  official: "Loja Oficial Shopee",
  preferred: "Vendedor Preferido",
}
