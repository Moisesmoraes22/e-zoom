// Phase 5 of the search tests: odd inputs, boundaries and limits.
import assert from "node:assert/strict"
import { test } from "node:test"

import {
  EMPTY_FILTERS,
  PRICE_RANGES,
  correctQuery,
  countByPriceRange,
  filterProducts,
  matchTier,
  queryGroups,
  sortProducts,
} from "../../src/lib/search.ts"
import type { Product } from "../../src/lib/types.ts"

let n = 0
const product = (title: string, extra: Partial<Product> = {}): Product => ({
  id: `p${++n}`,
  title,
  image: "",
  price: 100,
  store: "mercado_livre",
  category: "x",
  affiliateUrl: "",
  ...extra,
})
const search = (catalog: Product[], query: string, filters: Partial<typeof EMPTY_FILTERS> = {}) =>
  filterProducts(catalog, { ...EMPTY_FILTERS, query, ...filters })

const catalog = [
  product("Monitor Gamer 27"),
  product("Mouse Gamer"),
  product("Notebook 15.6 \"Pro\" (2024) [Novo] #1 R$ 5,00 100% OFF"),
  product(""),
  product("A"),
]

test("textos hostis não quebram e não são interpretados como código ou expressão regular", () => {
  const hostile = [
    "<script>alert(1)</script>",
    "'; DROP TABLE products;--",
    "[a-z]+",
    "(?<x>.*)",
    "${process.exit(1)}",
    "__proto__",
    "constructor",
    "toString",
    "hasOwnProperty",
    "valueOf",
    "null",
    "undefined",
    "NaN",
  ]
  for (const query of hostile) {
    assert.doesNotThrow(() => search(catalog, query), query)
    assert.equal(search(catalog, query).length, 0, `"${query}" não deveria achar nada`)
  }
})

test("sinais de pontuação dentro do título não atrapalham a busca", () => {
  assert.equal(search(catalog, "15.6").length, 1)
  assert.equal(search(catalog, "100%").length, 1)
  assert.equal(search(catalog, "r$ 5,00").length, 1)
  assert.equal(search(catalog, "#1").length, 1)
  assert.equal(search(catalog, "(2024)").length, 1)
  assert.equal(search(catalog, "\"pro\"").length, 1)
  assert.equal(search(catalog, "[novo]").length, 1)
})

test("título vazio ou de uma letra não quebra nem aparece à toa", () => {
  assert.doesNotThrow(() => search(catalog, "monitor"))
  assert.equal(search(catalog, "monitor").length, 1)
  assert.equal(matchTier("", queryGroups("monitor")), 0)
  assert.equal(search(catalog, "a").length, 1)
})

test("palavra repetida na consulta se comporta como uma só", () => {
  assert.equal(search(catalog, "gamer gamer gamer").length, 2)
  assert.equal(search(catalog, "monitor gamer monitor gamer").length, 1)
})

test("consulta enorme (5.000 letras ou 300 palavras) responde rápido e sem erro", () => {
  const start = performance.now()
  assert.equal(search(catalog, "a".repeat(5000)).length, 0)
  assert.equal(search(catalog, "gamer ".repeat(300)).length, 2)
  assert.equal(correctQuery("a".repeat(2000), catalog), null)
  assert.ok(performance.now() - start < 1000)
})

test("catálogo de 4.000 produtos com consulta de 6 palavras filtra e ordena rápido", () => {
  const big = Array.from({ length: 4000 }, (_, i) => product(`Produto ${i} Gamer Pro Max Ultra Plus ${i % 7}`, { price: i }))
  const start = performance.now()
  const found = search(big, "produto gamer pro max ultra plus")
  sortProducts(found, "relevance", "produto gamer pro max ultra plus")
  assert.equal(found.length, 4000)
  assert.ok(performance.now() - start < 1500, `levou ${Math.round(performance.now() - start)} ms`)
})

test("catálogo vazio: busca, ordenações e contagens devolvem vazio", () => {
  assert.deepEqual(search([], "monitor"), [])
  for (const sort of ["relevance", "price_asc", "discount_desc", "recent", "unit_price"] as const) {
    assert.deepEqual(sortProducts([], sort, "x"), [], sort)
  }
  assert.ok(countByPriceRange([]).every((r) => r.count === 0))
})

test("faixas de preço: o limite de cima é inclusivo e o de baixo não", () => {
  const cases: [number, string | null][] = [
    [50, "0-50"],
    [50.01, "50-100"],
    [100, "50-100"],
    [100.01, "100-300"],
    [300, "100-300"],
    [300.01, "300-1000"],
    [1000, "300-1000"],
    [1000.01, "1000+"],
    [Infinity, "1000+"],
    [-5, null],
    [NaN, null],
  ]
  for (const [price, expected] of cases) {
    const found = countByPriceRange([product("x", { price })]).filter((r) => r.count > 0).map((r) => r.value)
    assert.deepEqual(found, expected ? [expected] : [], `preço ${price}`)
  }
  assert.equal(PRICE_RANGES.length, 5)
})

test("preço NaN some dos filtros de preço, mas continua achável sem eles", () => {
  const items = [product("Fone Bom", { price: NaN }), product("Fone Normal", { price: 40 })]
  assert.equal(search(items, "fone", { priceRanges: ["0-50"] }).length, 1)
  assert.equal(search(items, "fone").length, 2)
})

test("desconto mínimo: o limite é inclusivo; preço igual ou maior que o original não conta", () => {
  const items = [
    product("a", { price: 90, originalPrice: 100 }), // 10%
    product("b", { price: 100, originalPrice: 100 }), // 0%
    product("c", { price: 100, originalPrice: 50 }), // aumento
    product("d", { price: 100 }), // sem preço antigo
  ]
  const run = (minDiscount: number | null) => search(items, "", { minDiscount }).map((p) => p.title)
  assert.deepEqual(run(10), ["a"])
  assert.deepEqual(run(11), [])
  assert.deepEqual(run(1), ["a"])
  assert.deepEqual(run(0), ["a", "b", "c", "d"])
  assert.deepEqual(run(null), ["a", "b", "c", "d"])
})

test("categoria inexistente não devolve nada, e filtros vazios não escondem nada", () => {
  assert.equal(search(catalog, "", { category: "nao-existe" }).length, 0)
  assert.equal(search(catalog, "", {}).length, catalog.length)
})

test("ordenações: lista de um item, empates mantêm a ordem e consulta estranha não quebra", () => {
  const one = [product("só um")]
  for (const sort of ["relevance", "price_asc", "discount_desc", "recent", "unit_price"] as const) {
    assert.equal(sortProducts(one, sort, "!!!").length, 1, sort)
  }
  const ties = [product("a"), product("b"), product("c")]
  assert.deepEqual(sortProducts(ties, "price_asc").map((p) => p.title), ["a", "b", "c"])
  assert.deepEqual(sortProducts(ties, "discount_desc").map((p) => p.title), ["a", "b", "c"])
  assert.deepEqual(sortProducts(ties, "recent").map((p) => p.title), ["a", "b", "c"])
})

test("sem 'createdAt', a ordenação por recentes não quebra", () => {
  const items = [product("sem data"), product("com data", { createdAt: "2026-01-01" })]
  assert.equal(sortProducts(items, "recent")[0].title, "com data")
})

// ---- Casos que eram lacunas na fase 5 e hoje estão corrigidos ----

test("consulta sem nenhuma letra ou número latino ('日本語', 'مرحبا') não devolve o catálogo inteiro", () => {
  assert.equal(search(catalog, "日本語").length, 0)
  assert.equal(search(catalog, "مرحبا").length, 0)
})

test("consulta só de símbolos ('.*', '!!!', '\\') não devolve o catálogo inteiro", () => {
  assert.equal(search(catalog, ".*").length, 0)
  assert.equal(search(catalog, "!!!").length, 0)
  assert.equal(search(catalog, "\\").length, 0)
  assert.equal(search(catalog, String.fromCharCode(0, 1)).length, 0)
})

test("produto de R$ 0 cai em alguma faixa de preço", () => {
  const found = countByPriceRange([product("brinde", { price: 0 })]).filter((r) => r.count > 0)
  assert.equal(found.length, 1)
})
