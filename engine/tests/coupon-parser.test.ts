import assert from "node:assert/strict"
import { test } from "node:test"

import { parseCoupons } from "../lib/coupon-parser.ts"

const POSTED = new Date("2026-10-07T12:00:00Z")
const END = (iso: string) => new Date(iso).toISOString()

test("cupom com condições próprias, categoria e data", () => {
  const [moda, brinq] = parseCoupons(
    `🎟️ MODANOMELI 👉 15% OFF
Moda | Compra mínima: R$79 | Desconto máx: R$50
Válido até 09.10, ou enquanto durarem os estoques, em produtos elegíveis.
🔗 https://bit.ly/4zhoKYz

🎟️ BRINCADEIRAS 👉 20% OFF
Brinquedos e Bebês | Compra mínima: R$59 | Desconto máx: R$50
Válido até 06.10, ou enquanto durarem os estoques.
🔗 https://bit.ly/4zj9Kti`,
    POSTED,
  )
  assert.deepEqual(moda, {
    code: "MODANOMELI",
    kind: "percent",
    value: 15,
    min_purchase: 79,
    max_discount: 50,
    category: "Moda",
    expires_at: END("2026-10-10T02:59:59Z"), // 09/10 23:59:59 em Brasília
    link: "https://bit.ly/4zhoKYz",
  })
  assert.equal(brinq.code, "BRINCADEIRAS")
  assert.equal(brinq.expires_at, END("2026-10-07T02:59:59Z"))
})

test("rodapé vale para os cupons que não trazem as próprias condições", () => {
  const coupons = parseCoupons(
    `🎟️ PELUCIAS10 👉 10% OFF*
🔗 https://bit.ly/4774jle

🎟️ BONECAS10 👉 10% OFF*
🔗 https://bit.ly/3TQ1l1c

*Válidos até 12.10, ou enquanto durarem os estoques, em produtos elegíveis. Compra mínima: R$50. Desconto máx: R$40.`,
    POSTED,
  )
  assert.equal(coupons.length, 2)
  for (const c of coupons) {
    assert.equal(c.min_purchase, 50)
    assert.equal(c.max_discount, 40)
    assert.equal(c.expires_at, END("2026-10-13T02:59:59Z"))
    assert.equal(c.category, null)
  }
  assert.equal(coupons[0].link, "https://bit.ly/4774jle")
  assert.equal(coupons[1].link, "https://bit.ly/3TQ1l1c")
})

test("valores com milhar, 'somente em' e cupom sem link", () => {
  const [a, b] = parseCoupons(
    `🎟️ DESCONTOSML 👉 25% OFF
Compra mínima: R$1 | Desconto máx.: R$1.500
Válido até 31/10, ou enquanto durarem os estoques
🔗 https://bit.ly/4rMZvL7

🎟️ VIPNOML 👉 10% OFF*
Compra mínima: R$199 | Desconto máx: R$100

Válidos somente em 07/10, enquanto durarem os estoques.`,
    POSTED,
  )
  assert.equal(a.max_discount, 1500)
  assert.equal(a.min_purchase, 1)
  assert.equal(b.link, null)
  assert.equal(b.expires_at, END("2026-10-08T02:59:59Z"))
})

test("desconto em reais e data que já passou vira o ano seguinte", () => {
  const [c] = parseCoupons("🎟️ NATAL50 👉 R$ 50,50 OFF\nVálido até 05/01\n", new Date("2026-12-20T12:00:00Z"))
  assert.equal(c.kind, "amount")
  assert.equal(c.value, 50.5)
  assert.equal(c.expires_at, END("2027-01-06T02:59:59Z"))
})

test("sem data nada é inventado, e mensagens sem cupom devolvem lista vazia", () => {
  const [c] = parseCoupons("🎟️ SEMDATA 👉 10% OFF\n🔗 https://bit.ly/x", POSTED)
  assert.equal(c.expires_at, null)
  assert.equal(c.min_purchase, null)
  assert.deepEqual(parseCoupons("Nem código precisa. 👇\n🔗 https://bit.ly/4rPpSQE", POSTED), [])
  assert.deepEqual(parseCoupons("", POSTED), [])
})
