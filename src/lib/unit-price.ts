export type UnitPrice = { value: number; unit: "kg" | "100 un" }

const WEIGHT = /(\d+(?:[.,]\d+)?)\s?(kg|g)\b/gi
const COUNT = /(\d{1,4})\s?(?:c[aá]psulas?|caps|comprimidos?|comps|tabletes?|gomas|sach[eê]s?|softgels?|doses?)/gi
// "2x200g" (count x size) and "Kit 2 ..." / "Kit 6x ..." (count of identical packs).
const COUNT_TIMES_SIZE = /(\d{1,2})\s?x\s?(\d+(?:[.,]\d+)?)\s?(kg|g)\b/i
// "12 Unidades", "6 barras": a pack of several pieces, so the size in the title is of ONE piece.
const PIECES = /(\d{1,4})\s?(?:unidades?|unids?|unds?|barras?|pacotes?|potes?|sach[eê]s?)\b/gi
const KIT = /\b(?:kit|combo|pack)\s*(?:com\s*)?(\d{1,2})x?\b/i

const num = (s: string) => Number(s.replace(",", "."))

/**
 * Price per kg (powders) or per 100 capsules/tablets/gummies, read from the title.
 * Null whenever the size is unclear (two different sizes, a "+" kit of different
 * products, or an implausible amount): a wrong R$/kg is worse than none.
 */
export function unitPrice(title: string, price: number): UnitPrice | null {
  if (!(price > 0) || /\s\+\s/.test(title)) return null
  const kit = Number(KIT.exec(title)?.[1] ?? 1)

  const times = COUNT_TIMES_SIZE.exec(title)
  const grams = new Set(
    (times ? [`${times[2]}${times[3]}`] : [...title.matchAll(WEIGHT)].map((m) => `${m[1]}${m[2]}`)).map((w) => {
      const [, n, u] = /^([\d.,]+)(kg|g)$/i.exec(w)!
      return num(n) * (u.toLowerCase() === "kg" ? 1000 : 1)
    }),
  )
  const hasCount = new RegExp(COUNT.source, "i").test(title)
  if (grams.size > 0 && hasCount) return null // "15kg 30 comprimidos": which one is the content?
  // "54g ... 12 Unidades": the price is of the box but the weight is of one bar, so no safe R$/kg.
  if (grams.size > 0 && [...title.matchAll(PIECES)].some((m) => Number(m[1]) > 1)) return null
  if (grams.size === 1) {
    const total = [...grams][0] * (times ? Number(times[1]) : kit)
    const perKg = (price / total) * 1000
    return total >= 20 && total <= 15_000 && perKg >= 5 ? { value: perKg, unit: "kg" } : null
  }
  if (grams.size > 1) return null

  const counts = new Set([...title.matchAll(COUNT)].map((m) => Number(m[1])))
  if (counts.size !== 1) return null
  const total = [...counts][0] * kit
  return total >= 10 && total <= 2000 ? { value: (price / total) * 100, unit: "100 un" } : null
}

if (process.argv[1]?.endsWith("unit-price.ts")) {
  const eq = (a: UnitPrice | null, v: number | null) =>
    console.assert(v === null ? a === null : a !== null && Math.abs(a.value - v) < 0.01, a, v)
  eq(unitPrice("Whey Protein 900g Sabor Morango", 90), 100) // R$100/kg
  eq(unitPrice("Creatina Monohidratada 1kg", 80), 80)
  eq(unitPrice("Kit 2x Creatina Monohidratada Pura Refil 500g", 100), 100)
  eq(unitPrice("Kit 6x Creatina 300g", 180), 100)
  eq(unitPrice("Creatina 60 Cápsulas", 30), 50) // R$50 per 100
  eq(unitPrice("Kit Whey 900g + Creatina 300g", 150), null) // different products
  eq(unitPrice("Creatina Monohidratada Pura 1kg, 500g, 600, 300g e 150g", 40), null) // several sizes
  eq(unitPrice("Pele 15kg 30 Comprimidos", 80), null) // weight and count together
  eq(unitPrice("Suplemento sem tamanho no título", 40), null)
  eq(unitPrice("Barra Proteína Amendoim E Chocolate 54g Winstage 12 Unidades", 133.3), null) // box of 12 bars
  eq(unitPrice("Barra Proteína Banana/chocolate Sem Açúcar Winstage 54g", 15.9), 15.9 / 0.054) // one bar: kept
  console.log("unit-price ok")
}
