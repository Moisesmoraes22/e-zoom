import assert from "node:assert/strict"
import test from "node:test"

import type { Product } from "../../src/lib/types.ts"
import { dropPercent, escapeHtml, isQuietHour, pickPosts, postCaption } from "../lib/telegram-post.ts"

const NOW = Date.parse("2026-10-12T15:00:00Z") // 12:00 in Brasília
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()

const offer = (over: Partial<Product> = {}): Product => ({
  id: "o1",
  title: "Fone <Pro> & Cia",
  image: "https://img/x.jpg",
  price: 80,
  priceHistory: [100, 80],
  isPriceDrop: true,
  dropAt: ago(1),
  seenAt: ago(0.5),
  store: "shopee",
  category: "eletronicos",
  affiliateUrl: "https://a",
  ...over,
})

test("dropPercent is read from the previous recorded price", () => {
  assert.equal(dropPercent(offer()), 20)
  assert.equal(dropPercent(offer({ priceHistory: [80] })), 0)
})

test("picks a recent credible drop and skips what was posted, old, small or not seen lately", () => {
  const list = [
    offer({ id: "ok" }),
    offer({ id: "posted" }),
    offer({ id: "old", dropAt: ago(12) }),
    offer({ id: "small", price: 95, priceHistory: [100, 95] }),
    offer({ id: "stale", seenAt: ago(6) }),
    offer({ id: "notdrop", isPriceDrop: false }),
  ]
  assert.deepEqual(pickPosts(list, new Set(["posted"]), NOW).map((p) => p.id), ["ok"])
})

test("biggest drop first, at most 2 per store and 3 per run", () => {
  const list = [
    offer({ id: "a", store: "shopee", price: 50, priceHistory: [100, 50] }),
    offer({ id: "b", store: "shopee", price: 60, priceHistory: [100, 60] }),
    offer({ id: "c", store: "shopee", price: 70, priceHistory: [100, 70] }),
    offer({ id: "d", store: "amazon", price: 75, priceHistory: [100, 75] }),
    offer({ id: "e", store: "mercado_livre", price: 85, priceHistory: [100, 85] }),
  ]
  assert.deepEqual(pickPosts(list, new Set(), NOW).map((p) => p.id), ["a", "b", "d"])
})

test("the caption escapes HTML and states the recorded previous price", () => {
  const text = postCaption(offer())
  assert.ok(text.includes("Fone &lt;Pro&gt; &amp; Cia"))
  assert.ok(text.includes("Caiu 20%"))
  assert.ok(text.includes("R$ 100,00") && text.includes("R$ 80,00"))
  assert.equal(escapeHtml("a<b>&"), "a&lt;b&gt;&amp;")
})

test("quiet hours are 23h to 7h in Brasília", () => {
  assert.equal(isQuietHour(Date.parse("2026-10-12T02:30:00Z")), true) // 23:30 BRT
  assert.equal(isQuietHour(Date.parse("2026-10-12T09:00:00Z")), true) // 06:00 BRT
  assert.equal(isQuietHour(Date.parse("2026-10-12T10:00:00Z")), false) // 07:00 BRT
  assert.equal(isQuietHour(NOW), false)
})
