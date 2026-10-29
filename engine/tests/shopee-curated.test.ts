import assert from "node:assert/strict"
import { test } from "node:test"

import { CURATED_SHOPEE } from "../lib/shopee-curated.ts"

test("curated Shopee ids are shopId.itemId numbers (they are inlined in the API query)", () => {
  for (const id of Object.keys(CURATED_SHOPEE)) assert.match(id, /^\d+\.\d+$/, id)
})

test("curated Shopee items point to a site category slug", () => {
  for (const [id, category] of Object.entries(CURATED_SHOPEE)) assert.match(category, /^[a-z]+(?:-[a-z]+)*$/, id)
})
