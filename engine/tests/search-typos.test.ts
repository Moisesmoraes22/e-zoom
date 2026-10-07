// Phase 4 of the search tests: typo tolerance ("Você quis dizer") and the edit distance behind it.
import assert from "node:assert/strict"
import { test } from "node:test"

import { EMPTY_FILTERS, correctQuery, editDistance, filterProducts } from "../../src/lib/search.ts"
import type { Product } from "../../src/lib/types.ts"

let n = 0
const product = (title: string): Product => ({
  id: `p${++n}`,
  title,
  image: "",
  price: 1,
  store: "mercado_livre",
  category: "x",
  affiliateUrl: "",
})
const times = (count: number, title: string) => Array.from({ length: count }, () => product(title))

const catalog = [
  ...times(5, "Whey Protein Isolado 900g"),
  product("Creatina Monohidratada 300g"),
  ...times(3, "Notebook Gamer Acer Nitro"),
  product("Monitor Gamer 27 Curvo"),
  product("Mouse Gamer Logitech"),
  product("Teclado Mecânico Redragon"),
  product("Cadeira Gamer Ergonômica"),
  product("Headset Gamer Hyperx"),
  product("Fone Bluetooth JBL"),
  product("Smartphone Samsung Galaxy A07"),
  product("iPhone 15 Pro 256GB"),
  product("Air Fryer Mondial 4L"),
  product("Geladeira Frost Free Electrolux"),
  product("Tênis Nike Corrida"),
  product("Controladora DJ Pioneer DDJ-FLX4"),
]
const fix = (query: string, base = catalog) => correctQuery(query, base)

test("editDistance: identidade, inserção, remoção e troca valem 0 ou 1", () => {
  assert.equal(editDistance("whey", "whey"), 0)
  assert.equal(editDistance("whey", "wheyy"), 1)
  assert.equal(editDistance("wheyy", "whey"), 1)
  assert.equal(editDistance("whey", "whex"), 1)
})

test("editDistance: duas letras vizinhas trocadas contam como uma mudança", () => {
  assert.equal(editDistance("wehy", "whey"), 1)
  assert.equal(editDistance("notbeook", "notebook"), 1)
})

test("editDistance: é simétrica e lida com texto vazio", () => {
  assert.equal(editDistance("abc", "xyz"), editDistance("xyz", "abc"))
  assert.equal(editDistance("", "abc"), 3)
  assert.equal(editDistance("abc", ""), 3)
  assert.equal(editDistance("", ""), 0)
})

test("corrige letras trocadas, faltando, sobrando e erradas", () => {
  assert.equal(fix("wehy"), "whey") // vizinhas trocadas
  assert.equal(fix("creatna"), "creatina") // faltando
  assert.equal(fix("wheyy"), "whey") // sobrando
  assert.equal(fix("kreatina"), "creatina") // trocada (k por c)
  assert.equal(fix("notbook"), "notebook")
  assert.equal(fix("tecldo"), "teclado")
  assert.equal(fix("monittor"), "monitor")
  assert.equal(fix("headest"), "headset")
  assert.equal(fix("samsumg"), "samsung")
  assert.equal(fix("geladera"), "geladeira")
})

test("corrige só a palavra errada e mantém as outras", () => {
  assert.equal(fix("fone bluetoth"), "fone bluetooth")
  assert.equal(fix("wehy protien"), "whey protein")
  assert.equal(fix("creatna 300g"), "creatina 300g")
})

test("não mexe no que já está certo", () => {
  assert.equal(fix("whey"), null)
  assert.equal(fix("whey protein"), null)
  assert.equal(fix("nitro"), null)
  assert.equal(fix("creatina 300g"), null)
})

test("uma palavra que é começo de palavra do catálogo conta como certa", () => {
  assert.equal(fix("controlador"), null) // início de 'controladora'
  assert.equal(fix("notebo"), null)
})

test("palavras com menos de 4 letras ficam como estão", () => {
  assert.equal(fix("tv"), null)
  assert.equal(fix("rx"), null)
  assert.equal(fix("abc"), null)
})

test("limite de edição: 1 mudança até 6 letras, 2 a partir de 7", () => {
  assert.equal(fix("whxx"), null) // 2 mudanças em 4 letras: longe demais
  assert.equal(fix("moxxse"), null) // 2 mudanças em 6 letras
  assert.equal(fix("nootebok"), "notebook") // 2 mudanças em 8 letras
  assert.equal(fix("cadexxra"), "cadeira") // 2 mudanças em 8 letras
})

test("sem nada parecido no catálogo, não inventa correção", () => {
  assert.equal(fix("xyzabc"), null)
  assert.equal(fix("qwerty"), null)
  assert.equal(fix("123456"), null)
})

test("entre duas opções à mesma distância, escolhe a palavra mais comum no catálogo", () => {
  const base = [...times(4, "Cabo USB Rápido"), product("Caro Presente")]
  assert.equal(fix("cafo", base), "cabo")
})

test("maiúsculas e acentos da consulta não atrapalham", () => {
  assert.equal(fix("WEHY"), "whey")
  assert.equal(fix("NOTBOOK"), "notebook")
  assert.equal(fix("TÊNIS"), null) // já existe no catálogo (sem acento)
})

test("entradas estranhas devolvem null e não quebram", () => {
  assert.equal(fix(""), null)
  assert.equal(fix("   "), null)
  assert.equal(fix("!!! ???"), null)
  assert.equal(fix("🔥🔥🔥"), null)
  assert.equal(fix("whey", []), null)
  assert.equal(fix("wehy", []), null)
})

test("a correção faz a busca achar resultado (o que a tela confere antes de mostrar)", () => {
  const fixed = fix("wehy protien")!
  assert.ok(filterProducts(catalog, { ...EMPTY_FILTERS, query: "wehy protien" }).length === 0)
  assert.ok(filterProducts(catalog, { ...EMPTY_FILTERS, query: fixed }).length > 0)
})

test("desempenho: consulta com vários erros num catálogo grande responde rápido", () => {
  const words = Array.from({ length: 4000 }, (_, i) => `palavra${i.toString(36)}x`)
  const big = Array.from({ length: 4000 }, (_, i) => product(`Produto ${words[i]} ${words[(i * 7) % 4000]} Gamer`))
  const start = performance.now()
  correctQuery("produtu gamr palavrx notebok tecldo moniter", big)
  const elapsed = performance.now() - start
  assert.ok(elapsed < 1500, `levou ${Math.round(elapsed)} ms`)
})

// ---- Lacunas encontradas na fase 4 (pendentes) ----

test("marca com 3 letras errada: 'nke' vira 'nike'", { todo: "palavras com menos de 4 letras nunca são corrigidas" }, () => {
  assert.equal(fix("tenis nke"), "tenis nike")
})

test("palavras coladas com erro: 'airfyer' vira 'air fryer'", { todo: "a correção compara palavra a palavra, não junta nem separa" }, () => {
  assert.equal(fix("airfyer"), "air fryer")
})

test("correção usa também os sinônimos: 'celualr' vira 'celular' mesmo se o catálogo só diz 'smartphone'", { todo: "o vocabulário da correção são só os títulos" }, () => {
  const base = [product("Smartphone Samsung Galaxy A07"), product("Smartphone Motorola G56")]
  assert.equal(fix("celualr", base), "celular")
})
