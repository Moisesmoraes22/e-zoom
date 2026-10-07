import assert from "node:assert/strict"
import { test } from "node:test"

import { mlSellerLocation } from "../lib/location.ts"

test("lê estado e cidade do endereço do vendedor do Mercado Livre", () => {
  assert.deepEqual(mlSellerLocation({ city: { name: "Belo Horizonte" }, state: { name: "Minas Gerais" } }), {
    state: "Minas Gerais",
    city: "Belo Horizonte",
  })
})

test("sem endereço, ou com partes vazias, devolve null e não inventa nada", () => {
  const empty = { state: null, city: null }
  assert.deepEqual(mlSellerLocation(undefined), empty)
  assert.deepEqual(mlSellerLocation(null), empty)
  assert.deepEqual(mlSellerLocation({}), empty)
  assert.deepEqual(mlSellerLocation({ city: { name: "  " }, state: { name: "" } }), empty)
  assert.deepEqual(mlSellerLocation({ state: { name: "Bahia" } }), { state: "Bahia", city: null })
})
