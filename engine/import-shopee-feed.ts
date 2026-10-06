/**
 * Imports the Shopee affiliate "Feed de produto" CSV (affiliate.shopee.com.br > Criativo).
 *
 *   node --env-file=.env.local engine/import-shopee-feed.ts <feed.csv>          (dry run)
 *   node --env-file=.env.local engine/import-shopee-feed.ts <feed.csv> --write  (saves)
 *
 * The feed is a snapshot: re-download it (~weekly) and re-run to refresh prices.
 * Needs SHOPEE_AFFILIATE_ID (the number after "an_" in your affiliate links).
 */
import { createReadStream } from "node:fs"

import { createClient } from "@supabase/supabase-js"

import { isSupplement } from "./lib/supplements.ts"
import type { OfferRow } from "./types.ts"

const PER_CATEGORY = 130
const PER_CATEGORY_MAX: Record<string, number> = { suplementos: 400 } // the niche we're growing
const SUB_ID = "ezoom"
const MIN_LIKES_FOR_RATING = 50

/** Feed top-level category -> our slug. Anything not listed (car parts, books, food...) is skipped. */
const CATEGORY: Record<string, string> = {
  "Home & Living": "casa",
  "Home Appliances": "casa",
  Beauty: "beleza",
  "Sports & Outdoors": "esporte",
  "Mom & Baby": "infantil",
  "Baby & Kids Fashion": "infantil",
  "Women Clothes": "moda",
  "Men Clothes": "moda",
  "Fashion Accessories": "moda",
  "Women Bags": "moda",
  "Men Bags": "moda",
  Watches: "moda",
  "Women Shoes": "calcados",
  "Men Shoes": "calcados",
  "Computers & Accessories": "eletronicos",
  "Mobile & Gadgets": "eletronicos",
  Audio: "eletronicos",
  "Cameras & Drones": "eletronicos",
  "Gaming & Consoles": "games",
}

type Row = Record<string, string>

async function* readCsv(path: string): AsyncGenerator<Row> {
  let header: string[] | null = null
  let field = ""
  let row: string[] = []
  let quoted = false
  for await (const chunk of createReadStream(path, { encoding: "utf8" }) as AsyncIterable<string>) {
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i]
      if (quoted) {
        if (c !== '"') field += c
        else if (chunk[i + 1] === '"') (field += '"', i++)
        else quoted = false
      } else if (c === '"') quoted = true
      else if (c === ",") (row.push(field), (field = ""))
      else if (c === "\n") {
        row.push(field.replace(/\r$/, ""))
        field = ""
        const cells = row
        row = []
        if (!header) header = cells.map((h) => h.replace(/^﻿/, ""))
        else if (cells.length === header.length) yield Object.fromEntries(header.map((h, i) => [h, cells[i]]))
      } else field += c
    }
  }
}

function toOffer(r: Row, affiliateId: string): (OfferRow & { score: number; likes: number }) | null {
  // Supplements are picked by title, whatever top-level category the feed files them under.
  const slug = isSupplement(r.title) ? "suplementos" : CATEGORY[r.global_category1]
  const link = r.product_link.match(/shopee\.com\.br\/product\/(\d+)\/(\d+)/)
  const price = Number(r.sale_price)
  const rating = Number(r.item_rating)
  if (!slug || !link || !r.image_link || r.title.length < 15) return null
  if (r.condition && r.condition !== "NEW" && r.condition !== "New") return null
  // Quality floor: good ratings on item and shop, sane price.
  if (!(rating >= 4.7) || !(Number(r.shop_rating) >= 4.7) || !(price >= 10 && price <= 3000)) return null

  const discount = Number(r.discount_percentage)
  const original = Number(r.price)
  const url = `https://shopee.com.br/product/${link[1]}/${link[2]}`
  return {
    store_id: "shopee",
    external_id: `${link[1]}.${link[2]}`,
    title: r.title.replace(/\s+/g, " ").trim().slice(0, 160),
    image: r.image_link,
    category_slug: slug,
    price,
    // Only the store's own discount; never invented.
    original_price: discount >= 5 && discount <= 50 && original > price ? original : null,
    url,
    affiliate_url: `https://shope.ee/an_redir?origin_link=${encodeURIComponent(url)}&affiliate_id=${affiliateId}&sub_id=${SUB_ID}`,
    is_free_shipping: false,
    source: "manual",
    // A grade from a handful of people means little: shown only with enough likes behind it.
    rating: Number(r.like || 0) >= MIN_LIKES_FOR_RATING ? rating : null,
    // Popularity (likes) + real discount + rating, to pick the best per category.
    likes: Number(r.like || 0),
    score: Math.log10(1 + Number(r.like || 0)) * 20 + Math.min(discount || 0, 50) * 0.5 + (rating - 4.5) * 20,
  }
}

async function main() {
  const [path, flag] = process.argv.slice(2)
  const affiliateId = process.env.SHOPEE_AFFILIATE_ID
  if (!path || !affiliateId) {
    console.error("Uso: import-shopee-feed.ts <feed.csv> [--write]  (SHOPEE_AFFILIATE_ID no .env.local)")
    process.exit(1)
  }

  const byCategory = new Map<string, (OfferRow & { score: number; likes: number })[]>()
  let total = 0
  for await (const row of readCsv(path)) {
    total++
    const offer = toOffer(row, affiliateId)
    if (offer) byCategory.set(offer.category_slug as string, [...(byCategory.get(offer.category_slug as string) ?? []), offer])
  }

  const picked: OfferRow[] = []
  for (const [slug, list] of byCategory) {
    const seen = new Set<string>()
    const best = list
      .sort((a, b) => b.score - a.score)
      // The feed repeats the same product from many shops: keep one per title start.
      .filter((o) => {
        const key = o.title.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "").slice(0, 28)
        return !seen.has(key) && !!seen.add(key)
      })
      .slice(0, PER_CATEGORY_MAX[slug] ?? PER_CATEGORY)
    console.log(`${slug.padEnd(12)} ${String(best.length).padStart(4)} escolhidas de ${list.length} que passaram no filtro`)
    picked.push(...best.map(({ score: _score, likes: _likes, ...offer }) => offer))
    const likes = best.map((o) => o.likes).sort((a, b) => a - b)
    console.log(`  curtidas: mín ${likes[0]}, mediana ${likes[likes.length >> 1]}`)
  }
  console.log(`\n${total} produtos no feed -> ${picked.length} ofertas selecionadas`)

  if (flag !== "--write") {
    const prices = picked.map((o) => o.price).sort((a, b) => a - b)
    console.log(`preços: min ${prices[0]}, mediana ${prices[prices.length >> 1]}, max ${prices.at(-1)}`)
    console.log(`com preço antigo real: ${picked.filter((o) => o.original_price).length}`)
    console.log("\nSimulação: nada foi gravado. Use --write para salvar.\n")
    for (const o of picked.filter((_, i) => i % Math.ceil(picked.length / 12) === 0)) {
      console.log(`- [${o.category_slug}] R$ ${o.price}${o.original_price ? ` (de ${o.original_price})` : ""} ${o.title.slice(0, 70)}`)
    }
    return
  }

  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.SUPABASE_URL || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY")
  const supabase = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false } })

  // The site shows "preço visto há X" from last_seen_at: use when the feed was generated
  // (file name ..._20261005T050915_1.csv, read as UTC = earliest plausible), not the import time.
  const stamp = path.match(/_(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  const startedAt = stamp
    ? new Date(Date.UTC(+stamp[1], +stamp[2] - 1, +stamp[3], +stamp[4], +stamp[5], +stamp[6])).toISOString()
    : new Date().toISOString()
  for (let i = 0; i < picked.length; i += 100) {
    const chunk = picked.slice(i, i + 100).map((o) => ({ ...o, is_active: true, last_seen_at: startedAt }))
    const { error } = await supabase.from("offers").upsert(chunk, { onConflict: "store_id,external_id" })
    if (error) throw error
  }
  // Products that left the new feed selection stop showing (only ones this importer created).
  const { error } = await supabase
    .from("offers")
    .update({ is_active: false })
    .eq("store_id", "shopee")
    .eq("source", "manual")
    .eq("is_active", true)
    .lt("last_seen_at", startedAt)
  if (error) throw error
  console.log(`${picked.length} ofertas da Shopee gravadas.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
