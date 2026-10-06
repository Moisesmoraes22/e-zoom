/**
 * Smaller copy of a store image for cards (they show 200-300px): Shopee's `_tn` is 320px
 * (~15KB instead of ~110KB) and Mercado Livre's `-O` is at most 500px (~25KB instead of ~60KB).
 * Anything else is returned untouched; the card falls back to the original if the small one fails.
 */
export function cardImage(url: string): string {
  if (/^https:\/\/cf\.shopee\.com\.br\/file\/[\w-]+$/.test(url)) return `${url}_tn`
  if (/^https:\/\/http2\.mlstatic\.com\/.+-F\.jpg$/.test(url)) return url.replace(/-F\.jpg$/, "-O.jpg")
  return url
}
