export interface ParsedCoupon {
  code: string
  kind: "percent" | "amount"
  value: number
  min_purchase: number | null
  max_discount: number | null
  category: string | null
  /** End of the last valid day (Brasília time); null when the post gives no date. */
  expires_at: string | null
  /** The channel's own short link; the collector swaps it for our affiliate link. */
  link: string | null
}

const HEADER = /🎟️?\s*([A-Za-z0-9]{3,30})\s*👉\s*(?:(\d{1,3})\s*%|R\$\s*(\d+(?:[.,]\d+)?))\s*OFF/i
const LINK = /https?:\/\/\S+/

const money = (text: string) => {
  const raw = text.trim()
  // "1.500,50" and "1500" -> number; a lone "." before 3 digits is a thousands separator.
  const normalized = /,/.test(raw) ? raw.replace(/\./g, "").replace(",", ".") : /\.\d{3}$/.test(raw) ? raw.replace(".", "") : raw
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

const find = (text: string, pattern: RegExp) => {
  const match = text.match(pattern)
  return match ? money(match[1]) : null
}

/** "até 12.10", "até 31/10", "somente em 07/10" -> end of that day in Brasília (UTC-3). */
function expiry(text: string, postedAt: Date): string | null {
  const match = text.match(/(?:at[ée]|somente em|somente)\s+(\d{1,2})[./](\d{1,2})/i)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  let year = postedAt.getUTCFullYear()
  let end = Date.UTC(year, month - 1, day, 23, 59, 59) + 3 * 3600_000
  // A date well before the post belongs to the next year ("até 05/01" posted in December).
  if (end < postedAt.getTime() - 90 * 86400_000) {
    year += 1
    end = Date.UTC(year, month - 1, day, 23, 59, 59) + 3 * 3600_000
  }
  return new Date(end).toISOString()
}

/**
 * Reads the coupons of one channel post. A post lists coupons as "🎟️ CODE 👉 10% OFF*" followed
 * by the conditions and a link. Lines after the last link are a footer that applies to every
 * coupon of the post that did not state its own value. Nothing is guessed: a missing field is null.
 */
export function parseCoupons(text: string, postedAt: Date): ParsedCoupon[] {
  const lines = text.split(/\r?\n/)
  const starts = lines.flatMap((line, i) => (HEADER.test(line) ? [i] : []))
  if (!starts.length) return []

  const blocks = starts.map((start, n) => lines.slice(start, starts[n + 1] ?? lines.length))
  const last = blocks[blocks.length - 1]
  const lastLink = last.findLastIndex((line) => LINK.test(line))
  const footer = lastLink >= 0 ? last.slice(lastLink + 1).join("\n") : ""

  return blocks.map((block) => {
    const head = block[0].match(HEADER)!
    const body = block.join("\n")
    const link = body.match(LINK)?.[0].replace(/[).,]+$/, "") ?? null
    const own = (pattern: RegExp) => find(body, pattern) ?? find(footer, pattern)
    const conditions = block.find((line) => /compra m[ií]nima/i.test(line))
    const prefix = conditions?.split("|")[0]
    const category = conditions && /\|/.test(conditions) && prefix && !/compra m[ií]nima/i.test(prefix) ? prefix.trim() : null
    return {
      code: head[1].toUpperCase(),
      kind: head[2] ? "percent" : "amount",
      value: head[2] ? Number(head[2]) : money(head[3])!,
      min_purchase: own(/compra m[ií]nima:?\s*R\$\s*(\d[\d.,]*\d|\d)/i),
      max_discount: own(/desconto m[aá]x\.?:?\s*R\$\s*(\d[\d.,]*\d|\d)/i),
      category,
      expires_at: expiry(body, postedAt) ?? expiry(footer, postedAt),
      link,
    }
  })
}
