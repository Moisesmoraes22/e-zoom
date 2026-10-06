import { isSupplement } from "./supplements.ts"

const URL_PATTERN =/https?:\/\/[^\s<>"')\]]+/gi
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

// Lines about payment or the buy box ("Até 7x de sem juros", "Selecione a opção de compra"),
// which are never a product name.
const NOT_A_TITLE =
  /sem juros|\b\d{1,2}\s?x\s*(de|sem|no)\b|selecione|programe e poupe|op[cç][aã]o de compra/i

/** Higher = more likely a product name; <= 0 means "looks like a slogan". */
function titleScore(line: string): number {
  if (line.length < 8 || NOT_A_TITLE.test(line)) return -1
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

// Matched against the title without accents, first match wins (order = priority).
const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ["games", /\b(ps5|ps4|playstation[0-9]?|xbox|nintendo|switch|gamer|controle|headset|console)\b/],
  ["infantil", /\b(infantil|bebe|crianca|brinquedo|boneca|lego|pokemon|hot wheels|transformers|figura|pelucia)\b/],
  ["beleza", /\b(perfume|shampoo|condicionador|creme|maquiagem|skincare|secador|batom|serum|hidratante|aparador|barbeador|oneblade|caspa|elixir|bio oil|kerastase|armani|desodorante)\b/],
  ["calcados", /\b(tenis|sapat\w*|chinelo|sandalia|bota)\b/],
  ["moda", /\b(camisas?|camisetas?|bermudas?|polo|jaquetas?|calcas?|vestidos?|mochilas?|bolsas?|relogios?|oculos)\b/],
  ["esporte", /\b(bicicleta|esteira|halter|academia|fitness|garrafa termica|copo termico)\b/],
  ["casa", /\b(air ?fryer|fritadeira|aspirador|cadeira|colchao|sofa|poltrona|mesa|escrivaninha|panela|frigideira|geladeira|microondas|micro-ondas|forno|cafeteira|sanduicheira|sorveteira|liquidificador|ventilador|ar-condicionado|ar condicionado|lampada|ferramentas|parafusadeira|furadeira)\b/],
  ["eletronicos", /\b(fone|smartwatch|celular|smartphone|iphone|galaxy|kindle|echo|alexa|soundbar|notebook|tablet|tv|monitor|carregador|adaptador|cabo|bateria|ssd|camera|bluetooth|caixa de som|teclado|mouse|mousepad|microfone|processador|ryzen|placa mae|placa de video|placa grafica|placa principal|rtx|radeon|geforce|cooler|water cooler|ventoinhas?|fans?|fonte|gabinete|impressora|suporte articulado|suporte de mesa|suporte fixo)\b/],
]

export function guessCategory(title: string): string | null {
  if (isSupplement(title) || /\b(proteico|chocowhey\w*)/i.test(title)) return "suplementos"
  const plain = title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  return CATEGORY_KEYWORDS.find(([, re]) => re.test(plain))?.[0] ?? null
}

if (process.argv[1]?.endsWith("message-parser.ts")) {
  const nl = String.fromCharCode(10)
  console.assert(extractTitle(["Até 7x de sem juros", "R$ 350", "https://amzn.to/x"].join(nl)) === null)
  console.assert(extractTitle(["Selecione a opção de compra: Programe e Poupe", "R$ 10"].join(nl)) === null)
  console.assert(extractTitle(["Kit Ventoinha 3x120mm ARGB Preto", "R$ 74"].join(nl)) === "Kit Ventoinha 3x120mm ARGB Preto")
  console.assert(guessCategory("Bloodborne Hits - PlayStation 4") === "games")
  console.assert(guessCategory("Processador AMD Ryzen 5 8400F") === "eletronicos")
  console.assert(guessCategory("Escrivaninha Industrial em L 2 Pecas") === "casa")
  console.assert(guessCategory("Whisky Johnnie Walker Red Label 1L") === null)
  console.assert(guessCategory("Whey Protein 900g") === "suplementos")
  console.log("message-parser ok")
}
