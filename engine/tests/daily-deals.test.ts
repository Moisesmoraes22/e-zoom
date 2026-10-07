import assert from "node:assert/strict"
import { test } from "node:test"

import { dailyDealsText, discountPercent, pickDailyDeals } from "../lib/daily-deals.ts"
import type { Product } from "../../src/lib/types.ts"

let n = 0
const NOW = Date.parse("2026-10-07T12:00:00Z")
const deal = (extra: Partial<Product> = {}): Product => ({
  id: `p${++n}`,
  title: `Produto ${n}`,
  image: "https://example.test/a.jpg",
  price: 70,
  originalPrice: 100,
  store: "mercado_livre",
  category: `cat${n}`,
  affiliateUrl: `https://example.test/o${n}`,
  seenAt: "2026-10-07T10:00:00Z",
  ...extra,
})

test("desconto real: só conta com preço antigo maior que o atual", () => {
  assert.equal(discountPercent(deal({ price: 70, originalPrice: 100 })), 30)
  assert.equal(discountPercent(deal({ price: 100, originalPrice: 100 })), 0)
  assert.equal(discountPercent(deal({ price: 100, originalPrice: 50 })), 0)
  assert.equal(discountPercent(deal({ originalPrice: undefined })), 0)
})

test("entram só ofertas com desconto mínimo, link de afiliado, foto e vistas recentemente", () => {
  const ok = deal()
  const semDesconto = deal({ price: 95 }) // 5%
  const semLink = deal({ affiliateUrl: "" })
  const semFoto = deal({ image: "" })
  const velha = deal({ seenAt: "2026-10-01T10:00:00Z" })
  assert.deepEqual(pickDailyDeals([ok, semDesconto, semLink, semFoto, velha], NOW).map((p) => p.id), [ok.id])
})

test("queda de preço registrada vem antes de desconto maior sem histórico", () => {
  const queda = deal({ price: 75, isPriceDrop: true }) // 25% + queda
  const grande = deal({ price: 40 }) // 60%
  assert.equal(pickDailyDeals([grande, queda], NOW)[0].id, queda.id)
})

test("limites por loja e por categoria, e no máximo 10", () => {
  const many = Array.from({ length: 30 }, (_, i) => deal({ price: 50 - (i % 5), category: `c${i % 12}` }))
  const picked = pickDailyDeals(many, NOW)
  assert.ok(picked.length <= 10)
  assert.ok(picked.filter((p) => p.store === "mercado_livre").length <= 4)
  const byCategory = new Map<string, number>()
  for (const p of picked) byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1)
  assert.ok([...byCategory.values()].every((c) => c <= 2))
})

test("sem ofertas boas, a lista fica vazia (nada é inventado para completar)", () => {
  assert.deepEqual(pickDailyDeals([], NOW), [])
  assert.deepEqual(pickDailyDeals([deal({ price: 99 })], NOW), [])
})

test("texto: título curto, preços, loja, link de afiliado, aviso de comissão e link do site", () => {
  const text = dailyDealsText(
    [deal({ title: "A".repeat(100), price: 70, originalPrice: 100, isFreeShipping: true, affiliateUrl: "https://example.test/x" })],
    "https://e-zoom.vercel.app",
    new Date("2026-10-07T15:00:00Z"),
  )
  assert.ok(text.startsWith("🔥 OFERTAS DO DIA - 07/10"))
  assert.ok(text.includes("De R$ 100,00 por R$ 70,00"))
  assert.ok(text.includes("-30%"))
  assert.ok(text.includes("Mercado Livre"))
  assert.ok(text.includes("frete grátis"))
  assert.ok(text.includes("https://example.test/x"))
  assert.ok(text.includes("…"), "título longo deveria ser cortado")
  assert.ok(text.includes("https://e-zoom.vercel.app/busca?ordenacao=desconto"))
  assert.ok(text.includes("Podemos receber comissão"))
})
