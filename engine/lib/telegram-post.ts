import type { Product } from "../../src/lib/types.ts"

/**
 * Which price drops go to the Telegram channel, and how each post reads. Real data only: the "from"
 * price is the previous price WE recorded, never a store list price, and nothing is said about stock
 * or when the store's promotion ends (the stores do not tell us).
 */

export const POST_DEFAULTS = {
  /** Smallest recorded drop worth a post. */
  minDropPercent: 10,
  /** A drop older than this is no longer news. */
  maxDropAgeHours: 8,
  /** The collector must have seen the offer this recently, or the price may be gone. */
  maxSeenAgeHours: 3,
  maxPerRun: 3,
  maxPerDay: 15,
  /** Same store at most this many times in one run, so the channel is not one shop. */
  perStore: 2,
}

const HOUR = 3_600_000

const STORE_NAMES: Record<string, string> = {
  mercado_livre: "Mercado Livre",
  shopee: "Shopee",
  amazon: "Amazon",
  telegram: "Amazon",
}

/** Percent the price fell from the previous recorded one (0 when there is no recorded drop). */
export const dropPercent = (p: Product) => {
  const previous = p.priceHistory?.at(-2)
  return previous && previous > p.price ? Math.round((1 - p.price / previous) * 100) : 0
}

/** Quiet hours in Brasília: nothing is posted from 23h to 7h; the drops wait for the morning. */
export const isQuietHour = (now: number) => {
  const hour = new Date(now - 3 * HOUR).getUTCHours()
  return hour >= 23 || hour < 7
}

/**
 * The offers to post now: a credible recorded drop, recent, seen recently, not posted in the last
 * 24 h (`posted`: offer ids), biggest drop first, capped per run and per store.
 */
export function pickPosts(
  products: Product[],
  posted: Set<string>,
  now = Date.now(),
  options: Partial<typeof POST_DEFAULTS> = {},
): Product[] {
  const { minDropPercent, maxDropAgeHours, maxSeenAgeHours, maxPerRun, perStore } = { ...POST_DEFAULTS, ...options }
  const ranked = products
    .filter((p) => p.isPriceDrop && p.dropAt && p.image && !posted.has(p.id))
    .filter((p) => now - Date.parse(p.dropAt!) <= maxDropAgeHours * HOUR)
    .filter((p) => p.seenAt && now - Date.parse(p.seenAt) <= maxSeenAgeHours * HOUR)
    .filter((p) => dropPercent(p) >= minDropPercent)
    .sort((a, b) => dropPercent(b) - dropPercent(a))

  const perStoreCount = new Map<string, number>()
  const picked: Product[] = []
  for (const p of ranked) {
    if (picked.length >= maxPerRun) break
    if ((perStoreCount.get(p.store) ?? 0) >= perStore) continue
    perStoreCount.set(p.store, (perStoreCount.get(p.store) ?? 0) + 1)
    picked.push(p)
  }
  return picked
}

const money = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Telegram HTML mode: only these three characters need escaping. */
export const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const short = (title: string, max = 90) => (title.length > max ? `${title.slice(0, max - 1).trimEnd()}…` : title)

export const productUrl = (site: string, p: Product) => `${site}/produto/${p.id}`

/** The caption (HTML parse mode) of one post. The link goes to the product page on the site. */
export function postCaption(p: Product): string {
  const previous = p.priceHistory!.at(-2)!
  const facts = [STORE_NAMES[p.store] ?? p.store]
  if (p.isFreeShipping) facts.push("frete grátis")
  return [
    `📉 <b>Caiu ${dropPercent(p)}%</b>: de ${money(previous)} para <b>${money(p.price)}</b>`,
    "",
    escapeHtml(short(p.title)),
    `🏬 ${escapeHtml(facts.join(" · "))}`,
    "",
    "<i>Preço registrado há poucas horas; pode mudar na loja a qualquer momento.</i>",
  ].join("\n")
}
