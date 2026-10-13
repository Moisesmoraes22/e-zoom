import { getCatalog } from "@/lib/offers"
import { toSearchItem } from "@/lib/search"

// The search fields of every offer, outside the page HTML: the page stays small and shows at once,
// and the list (about 5 MB as JSON) is fetched afterwards, cached by the CDN and by the browser.
// Served in parts so each response stays well under the platform's response size limit.
const PART_SIZE = 4000

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const part = Math.max(0, Number(params.get("part")) || 0)
  const category = params.get("category")
  const { products: catalog } = await getCatalog()
  // A category page asks only for its own category, so it never downloads the whole catalogue.
  const products = category ? catalog.filter((p) => p.category === category) : catalog
  const items = products.slice(part * PART_SIZE, (part + 1) * PART_SIZE).map(toSearchItem)
  return Response.json(
    { items, parts: Math.max(1, Math.ceil(products.length / PART_SIZE)) },
    { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600" } },
  )
}
