import assert from "node:assert/strict"
import { test } from "node:test"

import { prohibitedReason, summarizeDropped, withoutProhibited } from "../lib/title-rules.ts"

const reason = (title: string, category_slug: string | null = null) => prohibitedReason({ title, category_slug })

test("leaves out used and refurbished items", () => {
  assert.equal(reason("Jogo Seminovo Mafia Ii - Ps3", "celulares"), "usado ou recondicionado")
  assert.equal(reason("Liquidificador Philco Plq1300 1200w Vermelho Bom (Recondicionado)", "celulares"), "usado ou recondicionado")
  assert.equal(reason("Roteador Semi-Novo HUAWEI WS5200", "informatica"), "usado ou recondicionado")
  assert.equal(reason("Roteador TP-Link Archer C20 USADO", "informatica"), "usado ou recondicionado")
  assert.equal(reason("Ont Nokia G-240w-g Wifi Gigabit Mostruario Preto", "celulares"), "usado ou recondicionado")
})

test("keeps new items with similar words", () => {
  assert.equal(reason("Calça Cargo Masculina Outlet de fábrica", "moda"), null)
  assert.equal(reason("Tênis infantil Menino Volta As Aulas", "moda"), null)
  assert.equal(reason("50 Pçs Mostruario De Unhas Display De Esmaltes", "beleza"), null)
  assert.equal(reason("iPhone 15 128GB Preto Lacrado", "celulares"), null)
})

test("leaves out lubricants but not shaving razors", () => {
  assert.equal(reason("Gel Lubrificante Íntimo Hidranal com Ácido Hialurônico", "dermocosmeticos"), "lubrificante ou produto adulto")
  assert.equal(reason("Gel Lubrificante Volumão Excitante Masculino + Anel Erecao", "joias-relogios"), "lubrificante ou produto adulto")
  assert.equal(reason("Kit 24 Barbeadores 2 Lâminas Lubrificante Aparelho Barbear", "higiene-cuidados"), null)
  assert.equal(reason("Óleo Lubrificante Para Corrente Grafitado Bike", "esporte"), null)
})

test("leaves out sweets and snacks outside the categories where they are normal", () => {
  assert.equal(reason("Chocolate Zero Lactose Zero Açúcar 12x22g - Vitão", "celulares"), "doce, salgado ou alimento")
  assert.equal(reason("15 Snickers Chocolate Original Minis 450g", "outros"), "doce, salgado ou alimento")
  assert.equal(reason("Biscoito Sequilhos Laranja Zero Glúten 320g", "celulares"), "doce, salgado ou alimento")
  assert.equal(reason("Whey Protein Concentrado Sabor Chocolate 900g", "suplementos"), null)
  assert.equal(reason("Biscoito Premier Cookie Cães Adultos Coco e Aveia", "animais"), null)
  assert.equal(reason("Flauta Doce Yamaha Yrs23 G Germânica", "instrumentos"), null)
  assert.equal(reason("Sabonete Dove Erva Doce 3 Unidades", "higiene-cuidados"), null)
  assert.equal(reason("Kit Pesca Completo 4 Varas Telescópicas para Água Doce", "esporte"), null)
  assert.equal(reason("Pipoqueira Elétrica Ar Quente Sem Óleo 110v", "eletrodomesticos"), null)
  assert.equal(reason("Capa de Silicone Rosa-chiclete para iPhone 15", "acessorios-celular"), null)
  assert.equal(reason("Livro Receitas De Doces - Claudia", "livros"), null)
})

test("leaves out hookahs, spirits, airsoft and courses", () => {
  assert.equal(reason("Narguile Completo Kit Hookah Monster Barato Preto", "celulares"), "narguile, tabaco ou bebida alcoolica")
  assert.equal(reason("Gin Tanqueray London Dry 750ml", "outros"), "narguile, tabaco ou bebida alcoolica")
  assert.equal(reason("Violão Eletroacústico Vintage Auditorium Whisky Sour", "instrumentos"), null)
  assert.equal(reason("Pistola De Airsoft VG V307 Rossi 6mm Spring", "esporte"), "arma de pressao ou airsoft")
  assert.equal(reason("Curso Básico De Previdência Complementar", "celulares"), "curso ou servico")
  assert.equal(reason("Método De Leitura Para Guitarra - Curso De Guitarra", "instrumentos"), null)
})

test("keeps ordinary products untouched", () => {
  for (const title of ["Fone Bluetooth Sem Fio TWS", "Placa De Vídeo RX 580 8GB GDDR5", "Capa Banco Carro Couro Fiat Argo", "Perfume Colônia Candy Land"]) {
    assert.equal(reason(title), null, title)
  }
})

test("splits kept and dropped offers and summarizes the reasons", () => {
  const offers = [
    { title: "Fone Bluetooth", category_slug: "eletronicos" },
    { title: "Jogo Seminovo Hitman Ps3", category_slug: "celulares" },
    { title: "Jogo Seminovo Mass Effect 2 Ps3", category_slug: "celulares" },
    { title: "Narguile Completo Hookah", category_slug: "celulares" },
  ]
  const { kept, dropped } = withoutProhibited(offers)
  assert.equal(kept.length, 1)
  assert.equal(dropped.length, 3)
  assert.equal(summarizeDropped(dropped), "2 usado ou recondicionado, 1 narguile, tabaco ou bebida alcoolica")
})
