// The sitemap index and its parts: escaping, valid dates, chunking and the file names that are accepted.
import assert from "node:assert/strict"
import { test } from "node:test"

import { parseSitemapName, productChunks, sitemapIndexXml, SITEMAP_CHUNK, urlsetXml } from "../../src/lib/sitemap-xml.ts"

test("urls are escaped and the date is cut to the day", () => {
  const xml = urlsetXml([{ url: "https://x.com/busca?q=a&b=<c>", lastModified: "2026-10-15T12:34:56Z" }])
  assert.match(xml, /<loc>https:\/\/x\.com\/busca\?q=a&amp;b=&lt;c&gt;<\/loc>/)
  assert.match(xml, /<lastmod>2026-10-15<\/lastmod>/)
  assert.ok(xml.trimEnd().endsWith("</urlset>"))
})

test("an invalid date is left out instead of breaking the file", () => {
  assert.doesNotMatch(urlsetXml([{ url: "https://x.com/a", lastModified: "not a date" }]), /lastmod/)
})

test("the index lists each file as a <sitemap>", () => {
  const xml = sitemapIndexXml([{ url: "https://x.com/sitemaps/paginas.xml" }, { url: "https://x.com/sitemaps/produtos-1.xml" }])
  assert.equal((xml.match(/<sitemap>/g) ?? []).length, 2)
  assert.ok(xml.includes("<sitemapindex"))
})

test("offers are split in files of at most 5,000", () => {
  assert.equal(SITEMAP_CHUNK, 5000)
  assert.equal(productChunks(0), 0)
  assert.equal(productChunks(5000), 1)
  assert.equal(productChunks(5001), 2)
  assert.equal(productChunks(28624), 6)
})

test("only the known file names are accepted", () => {
  assert.deepEqual(parseSitemapName("paginas.xml"), { kind: "paginas" })
  assert.deepEqual(parseSitemapName("produtos-3.xml"), { kind: "produtos", part: 3 })
  for (const bad of ["produtos-0.xml", "produtos-.xml", "../etc/passwd", "produtos-1", "produtos-99999.xml", "x.xml"]) {
    assert.equal(parseSitemapName(bad), null, bad)
  }
})
