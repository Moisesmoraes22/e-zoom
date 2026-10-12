// What the welcome questions leave in the interest profile: chosen categories weigh the most and never fade.
import assert from "node:assert/strict"
import { test } from "node:test"

import { buildProfile, pickedCategories } from "../../src/lib/interest-profile.ts"

const DAY = 86_400_000
const events = (kind: string, category: string, ageDays: number, now: number) => ({
  t: now - ageDays * DAY,
  kind,
  category,
  terms: [],
})

test("chosen categories are read back from the stored events", () => {
  const now = Date.now()
  const raw = JSON.stringify([events("pick", "perfumes", 0, now), events("click", "livros", 0, now), events("pick", "games", 0, now)])
  assert.deepEqual(pickedCategories(raw), ["perfumes", "games"])
  assert.deepEqual(pickedCategories(""), [])
  assert.deepEqual(pickedCategories("not json"), [])
})

test("a chosen category does not fade with time, a clicked one does", () => {
  const now = Date.now()
  const raw = JSON.stringify([events("pick", "perfumes", 60, now), events("click", "livros", 60, now)])
  const profile = buildProfile(raw, now)
  assert.equal(profile.categories.get("perfumes"), 6)
  assert.ok((profile.categories.get("livros") ?? 0) < 0.1)
})

test("one chosen category is already enough profile to recommend from", () => {
  const profile = buildProfile(JSON.stringify([events("pick", "dermocosmeticos", 0, Date.now())]))
  assert.ok(profile.total >= 4)
})
