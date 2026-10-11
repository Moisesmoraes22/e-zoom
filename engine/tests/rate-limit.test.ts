import assert from "node:assert/strict"
import { test } from "node:test"

import { rateLimiter } from "../../src/lib/rate-limit.ts"

test("libera até o limite por visitante e volta a liberar na janela seguinte", () => {
  const allowed = rateLimiter(3, 1000)
  assert.deepEqual([1, 2, 3, 4].map(() => allowed("a", 0)), [true, true, true, false])
  assert.equal(allowed("b", 0), true) // outro visitante não é afetado
  assert.equal(allowed("a", 1001), true) // janela nova
})
