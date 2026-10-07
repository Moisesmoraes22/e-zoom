// Phase 2 of the search tests: how a typed query (and a title) is normalised before matching.
import assert from "node:assert/strict"
import { test } from "node:test"

import { matchTier, normalizeText, queryGroups } from "../../src/lib/search.ts"

const words = (query: string) => queryGroups(query).map((alts) => alts[0])
const finds = (title: string, query: string) => matchTier(title, queryGroups(query)) > 0

test("normalizeText: tira acentos, cedilha e trema e passa para minúsculas", () => {
  assert.equal(normalizeText("RELÓGIO"), "relogio")
  assert.equal(normalizeText("Ação Coração"), "acao coracao")
  assert.equal(normalizeText("Müller Café Naïve"), "muller cafe naive")
  assert.equal(normalizeText("Ç ã ü ñ"), "c a u n")
})

test("normalizeText: não muda dígitos nem letras sem acento", () => {
  assert.equal(normalizeText("iPhone 15 Pro Max 256GB"), "iphone 15 pro max 256gb")
})

test("normalizeText: é idempotente (normalizar duas vezes dá o mesmo)", () => {
  for (const text of ["Relógio Ação", "ÇÃO", "tênis   preto", "PS5!!!"]) {
    assert.equal(normalizeText(normalizeText(text)), normalizeText(text))
  }
})

test("normalizeText: acento solto (combinado) também some", () => {
  assert.equal(normalizeText("rélogio"), "relogio") // e + acento agudo combinado
})

test("queryGroups: espaços extras, tabs e quebras de linha não criam palavras vazias", () => {
  assert.deepEqual(words("  fone   bluetooth  "), ["fone", "bluetooth"])
  assert.deepEqual(words("fone\tbluetooth\n"), ["fone", "bluetooth"])
})

test("queryGroups: pontuação e símbolos separam palavras ou somem", () => {
  assert.deepEqual(words("fone-de-ouvido"), ["fone", "de", "ouvido"])
  assert.deepEqual(words("fone_de_ouvido"), ["fone", "de", "ouvido"])
  assert.deepEqual(words("coca-cola"), ["coca", "cola"])
  assert.deepEqual(words("tênis!!!"), ["tenis"])
  assert.deepEqual(words("50%"), ["50"])
  assert.deepEqual(words("tv 50\""), ["tv", "50"])
})

test("queryGroups: emoji é ignorado", () => {
  assert.deepEqual(words("🔥promo"), ["promo"])
  assert.deepEqual(words("🔥🔥🔥"), [])
})

test("queryGroups: consulta vazia ou só de símbolos não vira palavra", () => {
  assert.deepEqual(queryGroups(""), [])
  assert.deepEqual(queryGroups("   "), [])
  assert.deepEqual(queryGroups("!!! ??? ..."), [])
})

test("acentos e maiúsculas não importam, nem na consulta nem no título", () => {
  assert.ok(finds("Relógio Masculino", "relogio"))
  assert.ok(finds("Relogio Masculino", "RELÓGIO"))
  assert.ok(finds("AÇÃO de Natal", "acao"))
  assert.ok(finds("acao de natal", "AÇÃO"))
  assert.ok(finds("Tênis Corrida", "tenis"))
  assert.ok(finds("Tenis Corrida", "tênis"))
})

test("hífen no título ou na consulta não atrapalha", () => {
  assert.ok(finds("Pré-treino Black Skull", "pre treino"))
  assert.ok(finds("Fone de Ouvido Bluetooth", "fone-de-ouvido"))
  assert.ok(finds("Coca-Cola 2L", "coca cola"))
  assert.ok(finds("Coca Cola 2L", "coca-cola"))
})

test("números e letras juntos (4k, 15 pro) são preservados", () => {
  assert.ok(finds("TV 4K 50 polegadas", "4k"))
  assert.ok(finds("iPhone 15 Pro 256GB", "iphone 15 pro"))
  assert.ok(!finds("iPhone 14 Pro", "iphone 15"))
})

test("separador decimal: 15.6 e 15,6 se encontram", () => {
  assert.ok(finds("Notebook 15,6 polegadas", "15.6"))
  assert.ok(finds("Notebook 15.6 polegadas", "15,6"))
})

test("plural simples (-s) vira singular nas alternativas", () => {
  assert.ok(queryGroups("controles")[0].includes("controle"))
  assert.ok(queryGroups("mouses")[0].includes("mouse"))
})

test("palavras de até 3 letras não perdem o 's' final", () => {
  assert.deepEqual(queryGroups("gás")[0], ["gas"])
  assert.deepEqual(queryGroups("pés")[0], ["pes"])
})

// ---- Lacunas encontradas na fase 2 (pendentes: viram falha se alguém quebrar, mas não travam a suíte) ----

test("letras largas e ligaduras (NFKD): 'ＦＯＮＥ' e 'ﬁlme'", () => {
  assert.ok(queryGroups("ＦＯＮＥ").length > 0, "consulta com letras largas some e passa a casar com tudo")
  assert.ok(finds("Filme Infantil", "ﬁlme"))
})

test("plural -ões / -ais / -éis: 'botões' acha 'botão'", () => {
  assert.ok(finds("Botão de Emergência", "botões"))
  assert.ok(finds("Jornal Diário", "jornais"))
})

test("plural de sigla curta: 'tvs' acha 'tv'", { todo: "palavras com 3 letras não perdem o s" }, () => {
  assert.ok(finds("TV 50 polegadas", "tvs"))
})

test("hífen entre letra e número: 'ps-5' acha 'PS5'", { todo: "o hífen separa 'ps' de '5'" }, () => {
  assert.ok(finds("Console PS5 Slim", "ps-5"))
})

test("unidade colada ou separada: '500g' acha '500 g'", { todo: "'500g' e '500 g' são palavras diferentes" }, () => {
  assert.ok(finds("Whey 500 g Baunilha", "500g"))
  assert.ok(finds("Whey 500g Baunilha", "500 g"))
})
