import sharp from "sharp"

/** A photo with more than this share of dark pixels (gray below 70) reads as a hole on the white card. */
export const DARK_SHARE = 0.45

const MAX_BYTES = 3_000_000
const cache = new Map<string, boolean>()

/** Share (0..1) of dark pixels in an image, read from a 32x32 thumbnail (transparent counts as white). */
export async function darkShare(input: Buffer): Promise<number> {
  const { data } = await sharp(input)
    .flatten({ background: "#ffffff" })
    .resize(32, 32, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let dark = 0
  for (const v of data) if (v < 70) dark++
  return dark / data.length
}

async function isDark(url: string): Promise<boolean> {
  const hit = cache.get(url)
  if (hit !== undefined) return hit
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    const size = Number(res.headers.get("content-length") ?? 0)
    if (!res.ok || size > MAX_BYTES) return false
    const dark = (await darkShare(Buffer.from(await res.arrayBuffer()))) > DARK_SHARE
    cache.set(url, dark)
    return dark
  } catch {
    return false // unreachable or not decodable: no verdict, so no penalty (and not cached)
  }
}

/**
 * Photos, among these URLs, that are mostly black. Measured on real catalogue photos: about 4% of
 * the Shopee ones (products shot on black); catalogue photos on white stay under 0.35. A few images
 * per page build, verdicts kept in memory.
 */
export async function darkPhotos(urls: string[]): Promise<Set<string>> {
  const unique = [...new Set(urls)]
  const verdicts = await Promise.all(unique.map(async (url) => [url, await isDark(url)] as const))
  return new Set(verdicts.filter(([, dark]) => dark).map(([url]) => url))
}
