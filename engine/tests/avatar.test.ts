import assert from "node:assert/strict"
import test from "node:test"

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdefghijklmnop.supabase.co"
const { avatarPath, nameProblem, safeAvatarUrl } = await import("../../src/lib/avatar.ts")

const BASE = "https://abcdefghijklmnop.supabase.co/storage/v1/object/public/avatars"

test("only photos from our avatars bucket are shown", () => {
  assert.equal(safeAvatarUrl(`${BASE}/u1/1.jpg`), `${BASE}/u1/1.jpg`)
  assert.equal(safeAvatarUrl("https://evil.example/pixel.gif"), null)
  assert.equal(safeAvatarUrl("https://abcdefghijklmnop.supabase.co/storage/v1/object/public/comment-media/u1/1.jpg"), null)
  assert.equal(safeAvatarUrl(null), null)
  assert.equal(safeAvatarUrl(42), null)
})

test("the storage path is read back from the URL", () => {
  assert.equal(avatarPath(`${BASE}/u1/1.jpg`), "u1/1.jpg")
  assert.equal(avatarPath("https://evil.example/u1/1.jpg"), null)
})

test("name rules: 2 to 60 characters after trimming", () => {
  assert.equal(nameProblem("  Ana "), null)
  assert.equal(nameProblem("A"), "Digite seu nome.")
  assert.equal(nameProblem("   "), "Digite seu nome.")
  assert.ok(nameProblem("x".repeat(61)))
  assert.equal(nameProblem("x".repeat(60)), null)
})
