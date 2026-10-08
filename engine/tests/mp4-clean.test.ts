import assert from "node:assert/strict"
import { test } from "node:test"

import { scrubMp4 } from "../../src/lib/mp4-clean.ts"

const u32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0))
const box = (type: string, ...children: number[][]) => {
  const payload = children.flat()
  return [...u32(8 + payload.length), ...ascii(type), ...payload]
}
const text = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1")

const gps = box("udta", box("©xyz", ascii("+23.5505-046.6333/")))
const video = () =>
  new Uint8Array([
    ...box("ftyp", ascii("isom"), u32(0)),
    ...box("moov", box("mvhd", [1, 2, 3, 4]), gps, box("trak", box("tkhd", [9, 9]), box("udta", ascii("DEVICE-INFO")))),
    ...box("meta", ascii("XMP-LOCATION")),
    ...box("uuid", ascii("0123456789abcdef-secret")),
    ...box("mdat", ascii("FRAMES")),
  ])

test("apaga localização e dados do aparelho, sem mudar tamanho nem o conteúdo do vídeo", () => {
  const original = video()
  const bytes = video()
  assert.equal(scrubMp4(bytes), true)
  assert.equal(bytes.length, original.length)

  const out = text(bytes)
  for (const secret of ["+23.5505", "046.6333", "DEVICE-INFO", "XMP-LOCATION", "secret"]) {
    assert.ok(!out.includes(secret), `${secret} deveria ter sido apagado`)
  }
  assert.ok(out.includes("FRAMES"), "mdat intacto")
  assert.ok(out.includes("mvhd") && out.includes("tkhd"), "caixas necessárias ao vídeo ficam")
  assert.equal((out.match(/free/g) ?? []).length, 4)
})

test("as posições não mudam: mdat continua exatamente no mesmo lugar", () => {
  const original = video()
  const bytes = video()
  scrubMp4(bytes)
  const at = (b: Uint8Array) => text(b).indexOf("mdat")
  assert.equal(at(bytes), at(original))
})

test("arquivo que não é MP4/MOV é recusado e não é alterado", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, ...new Array(40).fill(7)])
  const copy = png.slice()
  assert.equal(scrubMp4(png), false)
  assert.deepEqual(png, copy)
  assert.equal(scrubMp4(new Uint8Array(4)), false)
})

test("arquivo danificado: não escreve fora das caixas nem quebra", () => {
  const bytes = video()
  // moov declara um tamanho maior que o arquivo
  const moovAt = text(bytes).indexOf("moov") - 4
  bytes.set(u32(0x7fffffff), moovAt)
  const before = bytes.slice()
  assert.equal(scrubMp4(bytes), true)
  assert.ok(text(bytes).includes("+23.5505") && bytes.length === before.length, "caixa inválida é ignorada")
})
