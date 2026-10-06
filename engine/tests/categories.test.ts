import assert from "node:assert/strict"
import { test } from "node:test"

import { refineCategory } from "../lib/categories.ts"

// [title, category the store gave, category it must end up in]. Every mistake found in a
// review goes here, so it can never come back. Add a row whenever a new one is found.
const CASES: [string, string, string][] = [
  // shoes filed as sports/fashion
  ["Tênis Feminino Racer Speedzone Fila", "esporte", "calcados"],
  ["Vans Old Skool Adulto Unissex", "esporte", "calcados"],
  ["Chuteira Futsal Umbro Pro 5 Bump Club Masculina", "esporte", "calcados"],
  ["Nike Court Vision Low Next Nature Masculino Adultos", "esporte", "calcados"],
  ["Chinelo Feminino Slim Havaianas Liso", "moda", "calcados"],
  ["Fila Rise Up Masculino", "moda", "calcados"],
  // ...but not things that only mention the word
  ["Bola De Tênis Wilson Championship Extra Duty Tubo 3 Bolas", "esporte", "esporte"],
  ["Kit 2 Raquete Tenis De Mesa Ping Pong Lisa", "esporte", "esporte"],
  ["Capa De Chuva Transparente Completa Com Bota Calça Capa Capuz", "esporte", "esporte"],
  ["Kit 6 Pares Meias Lupo Original Sapatilha Algodão", "moda", "moda"],
  ["Tênis Infantil Menino Calce Fácil Casual", "infantil", "infantil"],
  // electronics filed as games / home
  ["SSD Kingston NV3 500GB M2 2280 NVME PCIe 4.0", "games", "eletronicos"],
  ["Microfone Hollyland Lark A1 Duo Usb-c cor Preto", "games", "eletronicos"],
  ["Câmera de Segurança Inteligente Intelbras iM3 C Branca", "casa", "eletronicos"],
  ["Tv Smart 43 Polegadas Aoc Roku Hd Wi-fi", "casa", "eletronicos"],
  ["Fones de ouvido para jogos sem fio Redragon H510-PRO", "games", "games"],
  ["Rack Suspenso para TV até 55 Polegadas 160cm", "casa", "casa"],
  ["Mesa digitalizadora H420 com caneta", "eletronicos", "eletronicos"],
  // home / beauty / fashion / kids
  ["Escrivaninha De Escritório Home Office Berlim Em L", "eletronicos", "casa"],
  ["Painel de Natal Fundo Fotográfico Cenário Natalino", "eletronicos", "casa"],
  ["Prancha Philco PPR10 Titanium Digital Bivolt 230°C", "casa", "beleza"],
  ["Escova Secadora Britânia Bec07r 4 Em 1 1300w", "casa", "beleza"],
  ["Taiff Black Ion Secador De Cabelo Profissional 2000w", "casa", "beleza"],
  ["Refil Escova de Dente Elétrica Oral-B Precision Clean", "infantil", "beleza"],
  ["Boné MST Aba Curva Vermelho Ajustável", "esporte", "moda"],
  ["Boné Gucci Luxo Aba Curva Ajustável", "infantil", "moda"],
  ["Sunga Boxer Mash Masculina Estampada", "esporte", "moda"],
  ["Mochila Masculina Grande Notebook Impermeável", "eletronicos", "moda"],
  ["Cinta Modeladora Shortinho Confortável 4 Barbatanas", "beleza", "moda"],
  ["Buba Mamadeira Easy Flow Nuvem 270ml", "beleza", "infantil"],
  ["Lenços Umedecidos Huggies Recém Nascido Pack C/4", "beleza", "infantil"],
  ["Babador De Silicone Pega Migalhas Menina", "moda", "infantil"],
  ["Fralda Bigfral Derma Plus M 8 Unidades", "beleza", "beleza"],
  ["Taco De Sinuca Bilhar Profissional Com Capa Giz", "infantil", "esporte"],
  ["Lanterna Tática Led Le8311 Recarregável Usb", "moda", "esporte"],
  // gift cards and supplements
  ["Roblox R$ 100 eGift (Digital)", "eletronicos", "games"],
  ["Razer Gold Digital R$ 30 (digital)", "eletronicos", "games"],
  ["Anabolic Mass 28500 3kg Profit Labs Sabor Chocolate", "esporte", "suplementos"],
  ["2 Potes Vitamina B12 Metilcobalamina - 60 Cápsulas", "esporte", "suplementos"],
]

for (const [title, from, expected] of CASES) {
  test(`${from} -> ${expected}: ${title.slice(0, 50)}`, () => {
    assert.equal(refineCategory(title, from), expected)
  })
}

test("no category stays no category", () => {
  assert.equal(refineCategory("Whisky Johnnie Walker Red Label 1L", null), null)
})
