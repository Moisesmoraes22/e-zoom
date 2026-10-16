// Exibições are counted per position range; the recently viewed list is newest first and without repeats.
import assert from "node:assert/strict"
import { test } from "node:test"

import { areaOf, positionBucket, SHELF_NAME } from "../../src/lib/impressions.ts"
import { recentlyViewedIds } from "../../src/lib/interest-profile.ts"

test("positions are kept as ranges", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 8, 9, 16, 17, 80].map(positionBucket), [1, 2, 3, 4, 5, 5, 9, 9, 17, 17])
  assert.equal(positionBucket(undefined), 0)
  assert.equal(positionBucket(0), 0)
  assert.equal(positionBucket(Number.NaN), 0)
})

test("list names and page areas", () => {
  assert.ok(SHELF_NAME.test("prateleira-pc-completo"))
  assert.ok(!SHELF_NAME.test("Prateleira"))
  assert.ok(!SHELF_NAME.test("a'; drop table"))
  assert.equal(areaOf("/"), "home")
  assert.equal(areaOf("/busca"), "busca")
  assert.equal(areaOf("/categoria/pet"), "categoria")
  assert.equal(areaOf("/favoritos"), "outro")
})

test("recently viewed: newest first, each once, only opened or clicked offers", () => {
  const raw = JSON.stringify([
    { t: 1, kind: "view", id: "a", terms: [] },
    { t: 2, kind: "search", terms: ["tv"] },
    { t: 3, kind: "click", id: "b", terms: [] },
    { t: 4, kind: "view", id: "a", terms: [] },
    { t: 5, kind: "favorite", id: "c", terms: [] },
    { t: 6, kind: "pick", category: "pet", terms: [] },
  ])
  assert.deepEqual(recentlyViewedIds(raw), ["a", "b"])
  assert.deepEqual(recentlyViewedIds(raw, 1), ["a"])
  assert.deepEqual(recentlyViewedIds(""), [])
  assert.deepEqual(recentlyViewedIds("not json"), [])
})
