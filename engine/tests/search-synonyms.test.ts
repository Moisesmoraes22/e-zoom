// Phase 3 of the search tests: synonym expansion.
import assert from "node:assert/strict"
import { test } from "node:test"

import { SYNONYMS, matchTier, normalizeText, queryGroups } from "../../src/lib/search.ts"

const finds = (title: string, query: string) => matchTier(title, queryGroups(query)) > 0

test("lista de sinônimos: sem vazios, sem repetição dentro do grupo e já normalizada", () => {
  for (const group of SYNONYMS) {
    assert.ok(group.length >= 2, `grupo com menos de 2 termos: ${group}`)
    assert.equal(new Set(group).size, group.length, `termo repetido em ${group}`)
    for (const term of group) {
      assert.equal(term, normalizeText(term).trim(), `termo não normalizado: "${term}"`)
    }
  }
})

test("lista de sinônimos: uma palavra não aparece em dois grupos (misturaria assuntos)", () => {
  const seen = new Map<string, string>()
  for (const group of SYNONYMS) {
    for (const term of group) {
      assert.ok(!seen.has(term), `"${term}" está em dois grupos: ${seen.get(term)} e ${group}`)
      seen.set(term, group.join("/"))
    }
  }
})

test("sinônimos simples valem nos dois sentidos (e os de uma via, na direção certa)", () => {
  const pairs: [string, string][] = [
    ["Smartphone Samsung A07", "celular"],
    ["Celular Motorola G56", "smartphone"],
    ["Headset Gamer", "fone"],
    ["Fone Bluetooth", "headset"],
    ["Fone Bluetooth", "earbuds"],
    ["Earbuds TWS", "fone"],
    ["Televisão 50 polegadas", "tv"],
    ["TV 50 polegadas", "televisao"],
    ["TV 50 polegadas", "televisão"],
    ["Laptop Dell Inspiron", "notebook"],
    ["Notebook Dell Inspiron", "laptop"],
    ["Refrigerador Duplex", "geladeira"],
    ["Geladeira Frost Free", "refrigerador"],
    ["Fritadeira Elétrica 4L", "airfryer"],
    ["Air Fryer 4L", "fritadeira"],
    ["Sapatilha Feminina", "tenis"],
    ["Tênis de Corrida", "sapatilha"],
    ["Smartwatch Fit Pro", "relogio"],
    ["Relógio Smartwatch", "smartwatch"],
    ["Whey Protein Isolado", "proteina"],
    ["iPhone 15 Pro", "celular"],
    ["Galaxy A07 128GB", "smartphone"],
    ["Console PS5 Slim", "playstation"],
    ["Controle PS4 Dualshock", "playstation"],
  ]
  for (const [title, query] of pairs) assert.ok(finds(title, query), `"${query}" deveria achar "${title}"`)
})

test("sinônimo respeita acento e maiúscula", () => {
  assert.ok(finds("Whey Protein", "PROTEÍNA"))
  assert.ok(finds("TV 50", "TELEVISÃO"))
})

test("sinônimo vale para uma das palavras da consulta e as outras continuam exigidas", () => {
  assert.ok(finds("Smartphone Samsung 256GB", "celular 256gb"))
  assert.ok(!finds("Smartphone Samsung 128GB", "celular 256gb"))
  assert.ok(finds("Laptop Gamer RTX 4060", "notebook gamer"))
  assert.ok(!finds("Laptop Office", "notebook gamer"))
})

test("a forma colada da sigla acha o título escrito junto ou separado", () => {
  assert.ok(finds("Console PlayStation 5 Slim", "ps5"))
  assert.ok(finds("Console PlayStation5 Slim", "ps5"))
  assert.ok(finds("Air Fryer 4L", "airfryer"))
  assert.ok(finds("Pré-treino Black Skull", "pretreino"))
  assert.ok(finds("Controle PlayStation 4", "ps4"))
})

test("sinônimos não vazam para assuntos diferentes", () => {
  assert.ok(!finds("Console PS4 Slim", "ps5"))
  assert.ok(!finds("Console PS5 Slim", "ps4"))
  assert.ok(!finds("Fogão 5 Bocas", "geladeira"))
  assert.ok(!finds("Caderno Universitário", "notebook"))
  assert.ok(!finds("Smartphone Samsung", "tv"))
})

// ---- Casos que eram lacunas na fase 3 e hoje estão corrigidos ----

test("sinônimo + plural: 'celulares' acha 'Smartphone'", () => {
  assert.ok(finds("Smartphone Samsung A07", "celulares"))
  assert.ok(finds("Headset Gamer", "fones"))
  assert.ok(finds("Laptop Dell", "notebooks"))
  assert.ok(finds("Smartwatch Fit", "relógios"))
})

test("sinônimo de duas palavras digitado separado: 'air fryer' acha 'Airfryer'", () => {
  assert.ok(finds("Airfryer 4L", "air fryer"))
  assert.ok(finds("Fritadeira Elétrica", "air fryer"))
  assert.ok(finds("Console PS5 Slim", "playstation 5"))
  assert.ok(finds("Pretreino Black", "pre treino"))
})

test("'playstation' sozinho acha 'PS5' e 'PS4'", () => {
  assert.ok(finds("Console PS5 Slim", "playstation"))
})

test("marca específica não acha marca concorrente: 'iphone' não acha 'Galaxy'", () => {
  assert.ok(!finds("Smartphone Samsung Galaxy A07", "iphone"))
  assert.ok(!finds("Celular Motorola G56", "iphone"))
  assert.ok(!finds("iPhone 15 Pro", "galaxy"))
})

test("'smartwatch' não acha relógio comum", () => {
  assert.ok(!finds("Relógio Masculino Clássico Analógico", "smartwatch"))
})

test("'whey' não acha xampu com proteína", () => {
  assert.ok(!finds("Shampoo com Proteína de Trigo", "whey"))
})
