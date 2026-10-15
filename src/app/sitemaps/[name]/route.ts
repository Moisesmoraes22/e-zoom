import { categoryCounts, byRelevance } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"
import { parseSitemapName, SITEMAP_CHUNK, urlsetXml, type SitemapEntry } from "@/lib/sitemap-xml"

const HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
}

const STATIC_PATHS = ["/", "/busca", "/categorias", "/cupons", "/como-funciona", "/sobre", "/contato", "/perguntas-frequentes"]

export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const parsed = parseSitemapName((await params).name)
  if (!parsed) return new Response("Not found", { status: 404 })

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br"
  const { products, live } = await getCatalog()

  if (parsed.kind === "paginas") {
    const entries: SitemapEntry[] = STATIC_PATHS.map((path) => ({ url: `${site}${path}` }))
    // Only categories that really have offers.
    for (const c of categoryCounts(products)) entries.push({ url: `${site}/categoria/${c.slug}` })
    return new Response(urlsetXml(entries), { headers: HEADERS })
  }

  // Sample data must never be advertised to search engines.
  if (!live) return new Response("Not found", { status: 404 })
  const ranked = byRelevance(products)
  const slice = ranked.slice((parsed.part - 1) * SITEMAP_CHUNK, parsed.part * SITEMAP_CHUNK)
  if (slice.length === 0) return new Response("Not found", { status: 404 })
  const entries = slice.map((p) => ({ url: `${site}/produto/${p.id}`, lastModified: p.seenAt }))
  return new Response(urlsetXml(entries), { headers: HEADERS })
}
