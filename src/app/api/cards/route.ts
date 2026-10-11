import { getCatalog } from "@/lib/offers"
import { clientIp, rateLimiter } from "@/lib/rate-limit"
import type { Product } from "@/lib/types"

const MAX_IDS = 48
const TTL_MS = 5 * 60_000
const ID = /^[\w-]{1,64}$/
// A page asks for a few batches; a script walking the catalog asks for hundreds.
const allowed = rateLimiter(120)

/**
 * The catalog by id, kept in memory for a few minutes: reading it takes a dozen Supabase
 * queries, so a request must not pay that each time. A cold instance pays once.
 */
let memo: { at: number; byId: Promise<Map<string, Product>> } | null = null
function catalogById() {
  if (!memo || Date.now() - memo.at > TTL_MS) {
    const byId = getCatalog().then(({ products }) => new Map(products.map((p) => [p.id, p])))
    const entry = { at: Date.now(), byId }
    memo = entry
    byId.catch(() => {
      if (memo === entry) memo = null
    })
  }
  return memo.byId
}

/** Full offers for the cards on screen (the list pages carry only the search fields). */
export async function GET(request: Request) {
  if (!allowed(clientIp(request))) return Response.json([], { status: 429, headers: { "Retry-After": "60" } })
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .filter((id) => ID.test(id))
    .slice(0, MAX_IDS)
  const byId = await catalogById()
  const cards = ids.map((id) => byId.get(id)).filter((p): p is Product => !!p)
  return Response.json(cards, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  })
}
