import assert from "node:assert/strict"
import { test } from "node:test"

import { lowestFor } from "../../src/lib/lowest-price.ts"

const at = (iso: string) => Date.parse(iso)
const stats = (points: [number, string][]) => ({
  points: points.map(([price, when]) => ({ price, at: when })),
  since: points[0][1],
})

test("preço no mínimo da história inteira: dias desde que começamos a acompanhar", () => {
  const s = stats([[120, "2026-09-01T00:00:00Z"], [100, "2026-09-10T00:00:00Z"]])
  assert.deepEqual(lowestFor(s, 100, at("2026-10-10T00:00:00Z")), { days: 39, sinceStart: true })
})

test("já esteve mais baixo antes: conta desde que o preço subiu, se caiu depois", () => {
  const s = stats([[80, "2026-08-01T00:00:00Z"], [120, "2026-09-20T00:00:00Z"], [100, "2026-10-01T00:00:00Z"]])
  assert.deepEqual(lowestFor(s, 100, at("2026-10-10T00:00:00Z")), { days: 20, sinceStart: false })
})

test("subiu e ficou parado: não é pechincha, nenhuma afirmação", () => {
  const s = stats([[80, "2026-08-01T00:00:00Z"], [100, "2026-09-01T00:00:00Z"]])
  assert.equal(lowestFor(s, 100, at("2026-10-01T00:00:00Z")), null)
})

test("preço sem variação ou com um ponto só: nenhuma afirmação", () => {
  assert.equal(lowestFor(stats([[100, "2026-09-01T00:00:00Z"], [100, "2026-09-02T00:00:00Z"]]), 100, at("2026-10-01T00:00:00Z")), null)
  assert.equal(lowestFor(stats([[100, "2026-09-01T00:00:00Z"]]), 100, at("2026-10-01T00:00:00Z")), null)
})

test("preço acima de outros já vistos na janela: nenhuma afirmação", () => {
  const s = stats([[100, "2026-09-01T00:00:00Z"], [80, "2026-09-15T00:00:00Z"], [100, "2026-10-01T00:00:00Z"]])
  assert.equal(lowestFor(s, 100, at("2026-10-05T00:00:00Z")), null)
})
