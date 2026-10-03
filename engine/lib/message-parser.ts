const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi
const PRICE_PATTERN = /R\$\s?(\d{1,3}(?:\.\d{3})+(?:,\d{2})?|\d+(?:,\d{2})?)/gi

export function extractUrls(text: string): string[] {
  return [...new Set((text.match(URL_PATTERN) ?? []).map((u) => u.replace(/[.,!?]+$/, "")))]
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
  const values = [...text.matchAll(PRICE_PATTERN)]
    .map((m) => toNumber(m[1]))
    .filter((n) => Number.isFinite(n) && n > 0)
  if (values.length === 0) return null
  const unique = [...new Set(values)].sort((a, b) => a - b)
  const price = unique[0]
  const original = unique.length > 1 ? unique[unique.length - 1] : null
  // A "discount" above 90% is almost always a parsing accident (e.g. installments).
  if (original && price < original * 0.1) return { price: unique[1] ?? price, original: null }
  return { price, original }
}

export function extractTitle(text: string): string | null {
  const line = text
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
    .find((l) => l.length >= 8)
  return line ? line.slice(0, 160) : null
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
