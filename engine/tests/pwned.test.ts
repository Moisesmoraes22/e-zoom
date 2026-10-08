import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { test } from "node:test"

import { suffixInRange } from "../../src/lib/auth/pwned.ts"

// Real value from the service's documentation: SHA-1("password") = 5BAA6 1E4C9B93F3F0682250B6CF8331B7EE68FD8
test("sha-1 de 'password' tem o prefixo e o sufixo esperados pelo serviço", () => {
  const hash = createHash("sha1").update("password").digest("hex").toUpperCase()
  assert.equal(hash.slice(0, 5), "5BAA6")
  assert.equal(hash.slice(5), "1E4C9B93F3F0682250B6CF8331B7EE68FD8")
})

test("acha o sufixo na resposta, ignora maiúsculas e linhas de preenchimento (contagem 0)", () => {
  const body = ["0018A45C4D1DEF81644B54AB7F969B88D65:1", "1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004", "FFFFF0000000000000000000000000AAAAA:0"].join("\r\n")
  assert.equal(suffixInRange(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8"), true)
  assert.equal(suffixInRange(body, "1e4c9b93f3f0682250b6cf8331b7ee68fd8"), true)
  assert.equal(suffixInRange(body, "FFFFF0000000000000000000000000AAAAA"), false) // preenchimento
  assert.equal(suffixInRange(body, "00000000000000000000000000000000000"), false)
  assert.equal(suffixInRange("", "1E4C9B93F3F0682250B6CF8331B7EE68FD8"), false)
})
