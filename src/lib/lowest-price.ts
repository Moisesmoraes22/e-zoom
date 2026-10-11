import type { PriceStats } from "@/lib/types"

const DAY = 86_400_000

/**
 * For how long the current price has been the lowest we recorded: the days since the price last
 * stood BELOW it (the moment it rose to this level or above), or the whole tracked span when it
 * never did. Only when a higher price came after that moment (a real drop), so a price that merely
 * stayed flat after a rise is not sold as a bargain. Null when the history cannot back the claim.
 * `at` is the reference time; the offer's own last-seen time keeps the result stable for cached pages.
 */
export function lowestFor(
  stats: Pick<PriceStats, "points" | "since">,
  price: number,
  at: number,
): { days: number; sinceStart: boolean } | null {
  if (stats.points.length < 2) return null
  const lastLower = stats.points.findLastIndex((p) => p.price < price)
  const window = stats.points.slice(lastLower + 1)
  if (!window.some((p) => p.price > price)) return null
  const from = lastLower === -1 ? Date.parse(stats.since) : Date.parse(window[0].at)
  if (!Number.isFinite(from)) return null
  return { days: Math.max(0, Math.floor((at - from) / DAY)), sinceStart: lastLower === -1 }
}
