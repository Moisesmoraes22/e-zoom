import assert from "node:assert/strict"
import { test } from "node:test"

import { withoutBlocked } from "../lib/blocklist.ts"

const offers = [
  { store_id: "amazon" as const, external_id: "B076XQLJNL" },
  { store_id: "amazon" as const, external_id: "B000000001" },
  { store_id: "mercado_livre" as const, external_id: "B076XQLJNL" },
]

test("removes only the blocked store + id pair", () => {
  const kept = withoutBlocked(offers, [{ store_id: "amazon", external_id: "B076XQLJNL" }])
  assert.equal(kept.length, 2)
  assert.deepEqual(kept.map((o) => `${o.store_id}:${o.external_id}`), ["amazon:B000000001", "mercado_livre:B076XQLJNL"])
})

test("empty blocklist keeps everything", () => {
  assert.equal(withoutBlocked(offers, []).length, 3)
})
