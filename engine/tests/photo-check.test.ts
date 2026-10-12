import assert from "node:assert/strict"
import test from "node:test"

import sharp from "sharp"

import { DARK_SHARE, darkShare } from "../../src/lib/photo-check.ts"

const solid = (value: number) =>
  sharp({ create: { width: 40, height: 40, channels: 3, background: { r: value, g: value, b: value } } }).png().toBuffer()

test("a black photo is dark, a white one is not", async () => {
  assert.ok((await darkShare(await solid(10))) > DARK_SHARE)
  assert.ok((await darkShare(await solid(250))) < DARK_SHARE)
})

test("a transparent image counts as white", async () => {
  const empty = await sharp({ create: { width: 40, height: 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .toBuffer()
  assert.equal(await darkShare(empty), 0)
})

test("a dark product on a white background stays under the limit", async () => {
  // 40x40 white image with a black 16x16 square in the middle: 16% dark
  const square = await sharp({ create: { width: 16, height: 16, channels: 3, background: "#000" } }).png().toBuffer()
  const photo = await sharp({ create: { width: 40, height: 40, channels: 3, background: "#fff" } })
    .composite([{ input: square, left: 12, top: 12 }])
    .png()
    .toBuffer()
  assert.ok((await darkShare(photo)) < DARK_SHARE)
})
