import assert from "node:assert/strict"
import { test } from "node:test"

import { productJsonLd, serializeJsonLd } from "../../src/lib/structured-data.ts"
import type { Product } from "../../src/lib/types.ts"

const product = (extra: Partial<Product> = {}): Product => ({
  id: "abc-123",
  title: "Whey Protein 900g",
  image: "https://example.test/a.jpg",
  price: 99.9,
  store: "mercado_livre",
  category: "suplementos",
  affiliateUrl: "https://example.test/o",
  ...extra,
})

test("Product com Offer em reais, preço com duas casas e a página do site como URL", () => {
  const data = productJsonLd(product(), "https://e-zoom.vercel.app")
  assert.equal(data["@type"], "Product")
  assert.equal(data.name, "Whey Protein 900g")
  assert.deepEqual(data.image, ["https://example.test/a.jpg"])
  assert.equal(data.offers.priceCurrency, "BRL")
  assert.equal(data.offers.price, "99.90")
  assert.equal(data.offers.url, "https://e-zoom.vercel.app/produto/abc-123")
  assert.equal(data.offers.seller.name, "Mercado Livre")
})

test("não inventa nota: sem número de avaliações não há aggregateRating", () => {
  assert.equal("aggregateRating" in productJsonLd(product({ rating: 4.8 }), "https://x.test"), false)
  assert.equal("aggregateRating" in productJsonLd(product({ reviewsCount: 10 }), "https://x.test"), false)
  const both = productJsonLd(product({ rating: 4.8, reviewsCount: 120 }), "https://x.test")
  assert.deepEqual(both.aggregateRating, { "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 120 })
})

test("o JSON do script nunca fecha a tag nem quebra com títulos hostis", () => {
  const out = serializeJsonLd(productJsonLd(product({ title: '</script><script>alert(1)</script> "x"' }), "https://x.test"))
  assert.ok(!out.includes("</script>"))
  assert.ok(!out.includes("<"))
  assert.equal(JSON.parse(out).name, '</script><script>alert(1)</script> "x"')
})
