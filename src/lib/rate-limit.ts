/**
 * Per-visitor request limiter, in memory of one server instance. It slows down a script on a single
 * instance; instances do not share memory, so it is a brake, not a wall (the database caps what
 * matters, see record_click). Returns a function: true while the visitor is under the limit.
 */
export function rateLimiter(max: number, windowMs = 60_000) {
  const hits = new Map<string, { count: number; reset: number }>()
  return (key: string, now = Date.now()) => {
    if (hits.size > 5000) hits.clear()
    const bucket = hits.get(key)
    if (!bucket || bucket.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs })
      return true
    }
    return ++bucket.count <= max
  }
}

/** The visitor's address as the platform reports it (Vercel sets x-forwarded-for itself). */
export const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
