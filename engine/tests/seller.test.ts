import assert from "node:assert/strict"
import { test } from "node:test"

import { mlSellerLeader, shopeeShopBadge } from "../lib/seller.ts"

test("lê o selo MercadoLíder do vendedor", () => {
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: "platinum" } }), "platinum")
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: "gold" } }), "gold")
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: "silver" } }), "silver")
})

test("sem selo, sem reputação ou com valor desconhecido devolve null (nada é inventado)", () => {
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: null } }), null)
  assert.equal(mlSellerLeader({ seller_reputation: {} }), null)
  assert.equal(mlSellerLeader({ seller_reputation: null }), null)
  assert.equal(mlSellerLeader({}), null)
  assert.equal(mlSellerLeader(null), null)
  assert.equal(mlSellerLeader(undefined), null)
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: "diamante" } }), null)
  assert.equal(mlSellerLeader({ seller_reputation: { power_seller_status: "constructor" } }), null)
})

test("selo da Shopee: loja oficial, preferido e comum", () => {
  assert.equal(shopeeShopBadge([1]), "official")
  assert.equal(shopeeShopBadge([1, 2]), "official")
  assert.equal(shopeeShopBadge([2]), "preferred")
  assert.equal(shopeeShopBadge([4]), "preferred")
  assert.equal(shopeeShopBadge([]), null)
  assert.equal(shopeeShopBadge([3]), null)
  assert.equal(shopeeShopBadge(null), null)
  assert.equal(shopeeShopBadge(undefined), null)
  assert.equal(shopeeShopBadge("1"), null)
})
