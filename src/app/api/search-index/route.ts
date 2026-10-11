import { getCatalog } from "@/lib/offers"
import { toSearchItem } from "@/lib/search"

// The search fields of every offer, outside the page HTML: the page stays small and shows at once,
// and the list (about 5 MB as JSON) is fetched afterwards, cached by the CDN and by the browser.
// Served in parts so each response stays well under the platform's response size limit.
const PART_SIZE = 4000

export async function GET(request: Request) {
  const part = Math.max(0, Number(new URL(request.url).searchParams.get("part")) || 0)
  const { products } = await getCatalog()
  const items = products.slice(part * PART_SIZE, (part + 1) * PART_SIZE).map(toSearchItem)
  return Response.json(
    { items, parts: Math.max(1, Math.ceil(products.length / PART_SIZE)) },
    { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600" } },
  )
}
