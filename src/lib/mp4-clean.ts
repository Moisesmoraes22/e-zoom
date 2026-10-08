/**
 * Phones write the shooting place (GPS) and device data into the MP4/MOV container, in boxes named
 * `udta`, `meta` and `uuid`. This turns every such box (at the top level, inside `moov` and inside
 * each `trak`) into an empty `free` box of the SAME size, in place. Nothing moves, so the chunk
 * offsets of the video stay valid and the file plays as before.
 *
 * Returns false when the bytes are not an MP4/MOV file (no `ftyp` box first). Limit: location kept
 * as a timed metadata TRACK inside the media data (some Android cameras) is not touched.
 */
export function scrubMp4(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (bytes.length < 16 || boxType(bytes, 0) !== "ftyp") return false
  scrub(view, bytes, 0, bytes.length)
  return true
}

const WIPE = new Set(["udta", "meta", "uuid"])
const CONTAINERS = new Set(["moov", "trak"])

const boxType = (bytes: Uint8Array, at: number) =>
  String.fromCharCode(bytes[at + 4], bytes[at + 5], bytes[at + 6], bytes[at + 7])

function scrub(view: DataView, bytes: Uint8Array, start: number, end: number) {
  let pos = start
  while (pos + 8 <= end) {
    let size = view.getUint32(pos)
    let header = 8
    if (size === 1) {
      if (pos + 16 > end) return
      size = view.getUint32(pos + 8) * 2 ** 32 + view.getUint32(pos + 12)
      header = 16
    } else if (size === 0) {
      size = end - pos // the box runs to the end of the file
    }
    if (size < header || pos + size > end) return // damaged file: stop, never write outside a box

    const type = boxType(bytes, pos)
    if (WIPE.has(type)) {
      bytes.set([0x66, 0x72, 0x65, 0x65], pos + 4) // "free"
      bytes.fill(0, pos + header, pos + size)
    } else if (CONTAINERS.has(type)) {
      scrub(view, bytes, pos + header, pos + size)
    }
    pos += size
  }
}
