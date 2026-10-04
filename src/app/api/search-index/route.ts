import { getCatalog } from "@/lib/offers"

export const dynamic = "force-static"
export const revalidate = 300

/**
 * Light index of the live catalog for search suggestions and the favorites
 * sheet. Fetched lazily by the browser (first focus on a search box / first open
 * of favorites), so pages don't carry it in their own payload.
 */
export async function GET() {
  const { products } = await getCatalog()
  return Response.json(
    products.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      store: p.store,
    })),
  )
}
