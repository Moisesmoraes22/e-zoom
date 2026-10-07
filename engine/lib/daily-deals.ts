import type { Product } from "../../src/lib/types.ts"

/** Picks and writes the "Ofertas do dia" post (Telegram / WhatsApp / Instagram). Real data only. */

const STORE_NAMES: Record<string, string> = {
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  telegram: "Amazon",
}

const DAY = 86_400_000
export const DEFAULTS = {
  count: 10,
  perStore: 4,
  perCategory: 2,
  /** Smallest real discount worth a post. */
  minDiscount: 20,
  /** Offers not seen by the collector in this window may be gone, so they are left out. */
  maxAgeHours: 48,
}

export const discountPercent = (p: Product) =>
  p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

/**
 * Strongest first: a price that really fell (recorded history) beats a plain list-price discount,
 * then the bigger discount. Caps per store and per category keep the post from being one niche.
 */
export function pickDailyDeals(products: Product[], now = Date.now(), options: Partial<typeof DEFAULTS> = {}): Product[] {
  const { count, perStore, perCategory, minDiscount, maxAgeHours } = { ...DEFAULTS, ...options }
  const ranked = products
    .filter((p) => p.affiliateUrl && p.image && discountPercent(p) >= minDiscount)
    .filter((p) => !p.seenAt || now - Date.parse(p.seenAt) <= maxAgeHours * 3_600_000)
    .map((p, i) => ({ p, i, score: discountPercent(p) + (p.isPriceDrop ? 100 : 0) }))
    .sort((a, b) => b.score - a.score || a.i - b.i)

  const perStoreCount = new Map<string, number>()
  const perCategoryCount = new Map<string, number>()
  const picked: Product[] = []
  for (const { p } of ranked) {
    if (picked.length >= count) break
    if ((perStoreCount.get(p.store) ?? 0) >= perStore) continue
    if ((perCategoryCount.get(p.category) ?? 0) >= perCategory) continue
    perStoreCount.set(p.store, (perStoreCount.get(p.store) ?? 0) + 1)
    perCategoryCount.set(p.category, (perCategoryCount.get(p.category) ?? 0) + 1)
    picked.push(p)
  }
  return picked
}

const money = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const short = (title: string, max = 70) => (title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title)

/** The post text: one block per offer with the affiliate link, an affiliate disclosure and the site link. */
export function dailyDealsText(deals: Product[], site: string, date = new Date()): string {
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" })
  const lines = [`🔥 OFERTAS DO DIA - ${day}`, ""]
  deals.forEach((p, i) => {
    const facts = [`-${discountPercent(p)}%`, STORE_NAMES[p.store] ?? p.store]
    if (p.isFreeShipping) facts.push("frete grátis")
    lines.push(
      `${i + 1}. ${short(p.title)}`,
      `   De ${money(p.originalPrice!)} por ${money(p.price)} (${facts.join(" · ")})`,
      `   ${p.affiliateUrl}`,
      "",
    )
  })
  lines.push(
    `Mais ofertas: ${site}/busca?ordenacao=desconto`,
    "Preços e estoque podem mudar a qualquer momento. Podemos receber comissão pelas compras feitas pelos links.",
  )
  return lines.join("\n")
}
