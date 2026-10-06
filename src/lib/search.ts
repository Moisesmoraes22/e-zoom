import { SUPPLEMENT_TYPES, supplementTypeOf } from "@/lib/supplement-types"
import { unitPrice } from "@/lib/unit-price"
import { byRelevance } from "@/lib/deals"
import type { Product, SortOption, StoreSource } from "@/lib/types"
import { calculateDiscountPercent } from "@/lib/utils"

/** Lowercase without accents, so "relogio" finds "Relógio". */
export const normalizeText = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

/** Words people use for the same thing; searching one finds the others. */
const SYNONYMS = [
  ["whey", "proteina"],
  ["celular", "smartphone", "iphone", "galaxy"],
  ["fone", "headset", "headphone", "earbuds"],
  ["tv", "televisao"],
  ["notebook", "laptop"],
  ["geladeira", "refrigerador"],
  ["airfryer", "air fryer", "fritadeira"],
  ["ps5", "playstation 5", "playstation5"],
  ["ps4", "playstation 4", "playstation4"],
  ["tenis", "sapatilha"],
  ["relogio", "smartwatch"],
  ["pretreino", "pre treino"],
]

/** Words that clearly mean one category: results from it come first ("proteína" -> supplements, not hair care). */
const CATEGORY_HINTS: Record<string, string> = Object.fromEntries(
  ["whey", "proteina", "creatina", "bcaa", "suplemento", "colageno", "multivitaminico", "termogenico", "pretreino", "hipercalorico", "albumina"].map((w) => [w, "suplementos"]),
)

/** One list of acceptable spellings per typed word (plural, synonyms), accents removed. */
export function queryGroups(query: string): string[][] {
  const words = normalizeText(query).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean)
  return words.map((word) => {
    const alts = new Set([word])
    if (word.length > 3 && word.endsWith("s")) alts.add(word.slice(0, -1))
    for (const group of SYNONYMS) if (group.includes(word)) group.forEach((g) => alts.add(g))
    return [...alts]
  })
}

/**
 * 0 = the title does not match every typed word; 1 = matches inside words;
 * 2 = every word appears as a whole word; 3 = same, and the title starts with the first word.
 */
export function matchTier(title: string, groups: string[][]): number {
  if (groups.length === 0) return 1
  const plain = normalizeText(title)
  if (!groups.every((alts) => alts.some((a) => plain.includes(a)))) return 0
  const padded = ` ${plain.replace(/[^a-z0-9]+/g, " ")} `
  const whole = groups.every((alts) => alts.some((a) => padded.includes(` ${a} `)))
  if (!whole) return 1
  return groups[0].some((a) => padded.startsWith(` ${a} `)) ? 3 : 2
}

/** Price buckets shared by the filter panel, the filter chips and the home section. */
export const PRICE_RANGES = [
  { value: "0-50", label: "Até R$ 50", min: 0, max: 50 },
  { value: "50-100", label: "R$ 50 a R$ 100", min: 50, max: 100 },
  { value: "100-300", label: "R$ 100 a R$ 300", min: 100, max: 300 },
  { value: "300-1000", label: "R$ 300 a R$ 1.000", min: 300, max: 1000 },
  { value: "1000+", label: "Acima de R$ 1.000", min: 1000, max: Infinity },
] as const

export type PriceRange = (typeof PRICE_RANGES)[number]["value"]

export const isPriceRange = (value: string): value is PriceRange =>
  PRICE_RANGES.some((range) => range.value === value)

export interface ProductFilters {
  query?: string
  category?: string
  stores: StoreSource[]
  priceRanges: PriceRange[]
  minDiscount: number | null
  freeShippingOnly: boolean
}

export const EMPTY_FILTERS: ProductFilters = {
  category: undefined,
  stores: [],
  priceRanges: [],
  minDiscount: null,
  freeShippingOnly: false,
}

function matchesPriceRange(price: number, value: PriceRange) {
  const range = PRICE_RANGES.find((r) => r.value === value)!
  return price > range.min && price <= range.max
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters,
): Product[] {
  const groups = queryGroups(filters.query ?? "")

  return products.filter((product) => {
    if (groups.length && matchTier(product.title, groups) === 0) return false
    if (filters.category && product.category !== filters.category)
      return false
    if (filters.stores.length && !filters.stores.includes(product.store))
      return false
    if (
      filters.priceRanges.length &&
      !filters.priceRanges.some((range) =>
        matchesPriceRange(product.price, range),
      )
    )
      return false
    if (filters.minDiscount) {
      const discount = calculateDiscountPercent(
        product.price,
        product.originalPrice,
      )
      if (!discount || discount < filters.minDiscount) return false
    }
    if (filters.freeShippingOnly && !product.isFreeShipping) return false
    return true
  })
}

/** Real discount only: products without a recorded previous price count as 0. */
const discountOf = (p: Product) =>
  calculateDiscountPercent(p.price, p.originalPrice) ?? 0

export function sortProducts(products: Product[], sort: SortOption, query = "") {
  const sorted = [...products]
  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price)
    case "discount_desc":
      return sorted.sort((a, b) => discountOf(b) - discountOf(a))
    case "recent":
      // Newest in the catalog first; items without a date keep their order.
      return sorted.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    case "unit_price": {
      // Per kind of supplement (price per kg is only comparable inside the same kind),
      // cheapest first; per kg before per 100 capsules; unclear sizes go last.
      const rank = (p: Product) => {
        const u = unitPrice(p.title, p.price)
        if (!u) return Infinity
        const found = SUPPLEMENT_TYPES.findIndex((t) => t.value === supplementTypeOf(p.title))
        const kind = found < 0 ? SUPPLEMENT_TYPES.length : found // untyped supplements after the kinds
        return kind * 1e8 + (u.unit === "kg" ? 0 : 1e6) + u.value
      }
      return sorted.sort((a, b) => rank(a) - rank(b))
    }
    case "relevance":
    default: {
      const ranked = byRelevance(sorted)
      const groups = queryGroups(query)
      if (groups.length === 0) return ranked
      // With a search, how well the title matches comes first; the usual ranking breaks ties.
      const hinted = groups.flat().map((w) => CATEGORY_HINTS[w]).find(Boolean)
      return ranked
        .map((p, i) => ({ p, i, tier: matchTier(p.title, groups) + (hinted && p.category === hinted ? 10 : 0) }))
        .sort((a, b) => b.tier - a.tier || a.i - b.i)
        .map((e) => e.p)
    }
  }
}

/** URL values for `?ordenacao=` (Portuguese, stable, so they can become pages later). */
export const SORT_PARAMS: Record<string, SortOption> = {
  relevancia: "relevance",
  desconto: "discount_desc",
  preco: "price_asc",
  recente: "recent",
  "custo-beneficio": "unit_price",
}

export function countByStore(products: Product[]) {
  return products.reduce(
    (acc, product) => {
      acc[product.store] = (acc[product.store] ?? 0) + 1
      return acc
    },
    {} as Record<StoreSource, number>,
  )
}

/** How many offers fall in each price bucket (all of them, regardless of other filters). */
export function countByPriceRange(products: Product[]) {
  return PRICE_RANGES.map((range) => ({
    ...range,
    count: products.filter((p) => matchesPriceRange(p.price, range.value)).length,
  }))
}

/** Edit distance counting a swap of two neighbouring letters as one change ("wehy" -> "whey"). */
function editDistance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/**
 * For a search that found nothing: the same words with typos replaced by the closest
 * (then most common) word that appears in the catalog's titles, or null when no word
 * needed fixing or none is close enough. Words under 4 letters are left alone.
 */
export function correctQuery(query: string, products: Product[]): string | null {
  const words = normalizeText(query).replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean)
  const freq = new Map<string, number>()
  for (const p of products) {
    for (const w of new Set(normalizeText(p.title).split(/[^a-z0-9]+/))) {
      if (w.length >= 3) freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  let changed = false
  const fixed = words.map((word) => {
    if (word.length < 4 || [...freq.keys()].some((k) => k.includes(word))) return word
    const limit = word.length >= 7 ? 2 : 1
    let best: { w: string; dist: number; n: number } | null = null
    for (const [w, n] of freq) {
      if (Math.abs(w.length - word.length) > limit) continue
      const dist = editDistance(word, w)
      if (dist <= limit && (!best || dist < best.dist || (dist === best.dist && n > best.n))) best = { w, dist, n }
    }
    if (!best) return word
    changed = true
    return best.w
  })
  return changed ? fixed.join(" ") : null
}
