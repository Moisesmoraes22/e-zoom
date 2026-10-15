// The hero rotates who leads among equally good offers, but never lets an offer without a real discount beat one with it.
import assert from "node:assert/strict"
import { test } from "node:test"

import { ROTATE_MS, rotation, selectHeroOffers } from "../../src/lib/hero-select.ts"
import type { Product } from "../../src/lib/types.ts"

const offer = (id: string, store: string, category: string, price = 80, originalPrice: number | undefined = 100) =>
  ({ id, title: id, price, originalPrice, store, category, image: "https://x/y.jpg", createdAt: "2026-01-01T00:00:00Z" }) as unknown as Product

test("rotation is stable inside a window and changes between windows", () => {
  const t = 10 * ROTATE_MS
  assert.equal(rotation("a", t), rotation("a", t + 1000))
  const changed = Array.from({ length: 20 }, (_, i) => rotation(`o${i}`, t) !== rotation(`o${i}`, t + ROTATE_MS)).filter(Boolean)
  assert.ok(changed.length >= 15)
  for (let i = 0; i < 50; i++) assert.ok(rotation(`o${i}`, t) >= 0 && rotation(`o${i}`, t) < 1)
})

test("the leading offer changes over a day among equally good ones", () => {
  const stores = ["mercado_livre", "shopee", "amazon"]
  const products = Array.from({ length: 30 }, (_, i) => offer(`p${i}`, stores[i % 3], `c${i}`))
  const leaders = new Set<string>()
  for (let w = 0; w < 6; w++) leaders.add(selectHeroOffers(products, 20 * ROTATE_MS + w * ROTATE_MS)[0].id)
  assert.ok(leaders.size >= 3, `leaders: ${[...leaders].join(",")}`)
})

test("an offer with a real discount always beats one without, whatever the window", () => {
  const withDiscount = Array.from({ length: 4 }, (_, i) => offer(`d${i}`, "shopee", `cd${i}`))
  const without = Array.from({ length: 20 }, (_, i) => offer(`n${i}`, "mercado_livre", `cn${i}`, 100, undefined))
  for (let w = 0; w < 12; w++) {
    const picked = selectHeroOffers([...without, ...withDiscount], 5 * ROTATE_MS + w * ROTATE_MS)
    assert.ok(picked.slice(0, 2).every((p) => p.id.startsWith("d")), `window ${w}: ${picked.map((p) => p.id).join(",")}`)
  }
})
