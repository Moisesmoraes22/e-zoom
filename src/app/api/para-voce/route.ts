import { byRelevance, variantKey } from "@/lib/deals"
import { CATEGORIES } from "@/lib/mock-data"
import { getCatalog } from "@/lib/offers"
import type { Product } from "@/lib/types"

const BUDGETS = new Set([100, 300, 1000])
const MAX_CATEGORIES = 6
const SIZE = 12

/**
 * "Escolhidas para você": the best offers of the categories picked in the welcome questions, within the
 * budget, mixed round-robin so every category shows up. Only the choices are in the URL (no visitor data),
 * so the CDN keeps one answer per combination.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const known = new Set(CATEGORIES.map((c) => c.slug))
  const cats = [...new Set((params.get("cats") ?? "").split(","))].filter((c) => known.has(c)).slice(0, MAX_CATEGORIES).sort()
  const budget = Number(params.get("ate"))
  const headers = { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" }
  if (cats.length === 0) return Response.json([], { headers })

  const { products } = await getCatalog()
  const within = (p: Product) => !BUDGETS.has(budget) || p.price <= budget
  const lists = cats.map((slug) => {
    const ranked = byRelevance(products.filter((p) => p.category === slug && p.image))
    const cheap = ranked.filter(within)
    // A budget that leaves a category almost empty is dropped for it, so nothing looks broken.
    return cheap.length >= 4 ? cheap : ranked
  })

  const picked: Product[] = []
  const seen = new Set<string>()
  for (let round = 0; picked.length < SIZE && round < SIZE; round++) {
    for (const list of lists) {
      const next = list.find((p) => !seen.has(variantKey(p.title)))
      if (!next) continue
      seen.add(variantKey(next.title))
      picked.push(next)
      if (picked.length === SIZE) break
    }
  }
  return Response.json(picked, { headers })
}
