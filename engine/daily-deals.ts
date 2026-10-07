// Generates today's "Ofertas do dia" post from the live catalogue.
//   node --env-file=.env.local --import ./engine/tests/alias.mjs engine/daily-deals.ts
// Writes ofertas-do-dia.txt (ignored by git) and prints it. Nothing is posted anywhere.
import { writeFileSync } from "node:fs"

import { getCatalog } from "../src/lib/offers.ts"
import { dailyDealsText, pickDailyDeals } from "./lib/daily-deals.ts"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://e-zoom.vercel.app"

const { products, live } = await getCatalog()
if (!live) {
  console.error("Catálogo ao vivo indisponível (caiu nos dados de exemplo): nada foi gerado.")
  process.exit(1)
}
const deals = pickDailyDeals(products)
if (deals.length === 0) {
  console.error("Nenhuma oferta passou nos critérios hoje.")
  process.exit(1)
}
const text = dailyDealsText(deals, SITE)
writeFileSync("ofertas-do-dia.txt", text, "utf8")
console.log(text)
console.log(`\n(${deals.length} ofertas de ${products.length}; salvo em ofertas-do-dia.txt)`)
