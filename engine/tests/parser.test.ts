import assert from "node:assert/strict"
import { test } from "node:test"

import { extractTitle, guessCategory } from "../lib/message-parser.ts"
import { isSupplement } from "../lib/supplements.ts"

const nl = String.fromCharCode(10)
const post = (title: string) => [title, "R$ 10", "https://amzn.to/x"].join(nl)

// Lines that are promo chatter, not a product name, must never become the title.
for (const slogan of [
  "A RAPUNZEL USAVA ESSE",
  "CADA ROLO FOLHA TRIPLA",
  "PRA QUEM GOSTA DO LEITE CREMOSO",
  "PERFUMAÇO DA ARMANI, parceladinho tá valendo",
  "REDBULL ZERO TÁ LIBERADO",
  "Até 7x de sem juros",
  "Selecione a opção de compra: Programe e Poupe",
]) {
  test(`rejects title: ${slogan}`, () => assert.equal(extractTitle(post(slogan)), null))
}

for (const real of ["Kit Ventoinha 3x120mm ARGB Preto", "REFIL DO SHAMPOO ANTI-CALVO", "Apple iPhone 18 Pro de 256 GB — Preto"]) {
  test(`keeps title: ${real}`, () => assert.notEqual(extractTitle(post(real)), null))
}

test("telegram category guess", () => {
  assert.equal(guessCategory("Bloodborne Hits - PlayStation 4"), "games")
  assert.equal(guessCategory("Processador AMD Ryzen 5 8400F"), "eletronicos")
  assert.equal(guessCategory("Escrivaninha Industrial em L 2 Pecas"), "casa")
  assert.equal(guessCategory("Whisky Johnnie Walker Red Label 1L"), null)
})

test("supplements are not cosmetics, pet food or shakers", () => {
  assert.equal(isSupplement("Whey Protein 900g Chocolate"), true)
  assert.equal(isSupplement("Shampoo Proteína Capilar"), false)
  assert.equal(isSupplement("Proteína Condicionante by Boca Rosa 200ml - Cadiveu"), false)
  assert.equal(isSupplement("Coqueteleira 600ml Adaptogen Preto"), false)
})
