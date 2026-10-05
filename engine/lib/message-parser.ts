const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi
const PRICE_PATTERN = /R\$\s?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:,\d{2})?)/gi

export function extractUrls(text: string): string[] {
  return [...new Set((text.match(URL_PATTERN) ?? []).map((u) => u.replace(/[.,!?]+$/, "")))]
}

/**
 * A post with several products ("Item A - R$ 9 / link / Item B - R$ 14 / link") must
 * not mix prices: each chunk ends at its link. Single-link posts stay whole.
 */
export function splitByLinks(text: string): string[] {
  const matches = [...text.matchAll(URL_PATTERN)]
  if (matches.length < 2) return [text]
  let start = 0
  return matches.map((m) => {
    const end = m.index + m[0].length
    const chunk = text.slice(start, end)
    start = end
    return chunk
  })
}

function toNumber(raw: string) {
  return Number(raw.replace(/\./g, "").replace(",", "."))
}

/**
 * "De R$ 399 por R$ 259" -> { price: 259, original: 399 }.
 * One price only -> original is null (we never invent a discount).
 * Messages with coupons/installments can be ambiguous; the connector
 * keeps `source = 'telegram'` so these can be re-checked against the store.
 */
export function parsePrices(text: string) {
  // The real price is only known at checkout: whatever is shown is a placeholder.
  if (/(valor|pre[cç]o)\s+(final\s+)?(na|no|ao)\s+(finaliza|carrinho|checkout)/i.test(text)) return null
  const values = [...text.matchAll(PRICE_PATTERN)]
    // Coupon / cashback / installment amounts are not the product price.
    .filter((m) => {
      const before = text.slice(Math.max(0, m.index - 24), m.index)
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 14)
      return (
        !/(cupom|cashback|desconto|economize|ganhe|volta|\d\s?x\s*(de)?)\s*[^\nR]{0,14}$/i.test(before) &&
        !/^\s*(off|de\s+(desconto|cashback)|em\s+cashback)/i.test(after)
      )
    })
    .map((m) => toNumber(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 1)
  if (values.length === 0) return null
  const unique = [...new Set(values)].sort((a, b) => a - b)
  const price = unique[0]
  const original = unique.length > 1 ? unique[unique.length - 1] : null
  // A "discount" above 90% is almost always a parsing accident (e.g. installments).
  if (original && price < original * 0.1) return { price: unique[1] ?? price, original: null }
  return { price, original }
}

// Hype/CTA words: lines made of these are slogans, not product names.
const SLOGAN =
  /\b(corre|corra|aproveit\w*|imperd[ií]vel|achadinho|baratinho|bomba|urgente|rel[aâ]mpago|r[aá]pido|link|clique|compre|garanta|estoque|cupom|resgate|desconto|oferta|promo[cç][aã]o|frete|parcel\w*|vista|dispon[ií]vel|canal|grupo|entre|participe)\b|[!?]|^#/i

/** Higher = more likely a product name; <= 0 means "looks like a slogan". */
function titleScore(line: string): number {
  if (line.length < 8) return -1
  const letters = line.replace(/[^\p{L}]/gu, "")
  let score = Math.min(line.length, 60) / 10
  if (/\d/.test(line)) score += 1 // model numbers, sizes, capacities
  if (letters.length > 6 && letters === letters.toUpperCase()) score -= 2 // SHOUTING
  if (SLOGAN.test(line)) score -= 4
  return score
}

export function extractTitle(text: string): string | null {
  const lines = text
    .split("\n")
    .map((l) =>
      l
        .replace(URL_PATTERN, "")
        .replace(PRICE_PATTERN, "")
        .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}*_`~]/gu, "")
        .replace(/\b(de|por|apenas|só|cupom|oferta|promoção)\s*:?\s*$/i, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .map((line) => ({ line, score: titleScore(line) }))
  // Best score wins; ties go to the earlier line. Nothing above 0 -> no title (skip the offer).
  const best = lines.reduce<{ line: string; score: number } | null>(
    (top, l) => (l.score > (top?.score ?? 0) ? l : top),
    null,
  )
  return best ? best.line.slice(0, 160) : null
}

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ["games", /\b(ps5|ps4|xbox|nintendo|gamer|controle|headset|console)\b/i],
  ["calcados", /\b(t[eê]nis|sapat|chinelo|sand[aá]lia|bota)\b/i],
  ["beleza", /\b(perfume|shampoo|creme|maquiagem|skincare|secador|batom)\b/i],
  ["esporte", /\b(bicicleta|esteira|halter|whey|academia|fitness)\b/i],
  ["moda", /\b(camisa|camiseta|jaqueta|cal[cç]a|vestido|mochila|bolsa|rel[oó]gio)\b/i],
  ["infantil", /\b(infantil|beb[eê]|crian[cç]a|brinquedo|boneca|lego)\b/i],
  ["casa", /\b(air ?fryer|fritadeira|aspirador|cadeira|colch[aã]o|sof[aá]|panela|geladeira|microondas|liquidificador)\b/i],
  ["eletronicos", /\b(fone|smartwatch|celular|smartphone|notebook|tablet|tv|monitor|carregador|ssd|c[aâ]mera|bluetooth)\b/i],
]

export function guessCategory(title: string): string | null {
  return CATEGORY_KEYWORDS.find(([, re]) => re.test(title))?.[0] ?? null
}
