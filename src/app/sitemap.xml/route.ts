import { getCatalog } from "@/lib/offers"
import { productChunks, sitemapIndexXml } from "@/lib/sitemap-xml"

// The index lists a few files instead of one with everything: pages and categories first, then the offers
// ranked by how strong they are (relevance), 5,000 per file. Sample data is never advertised.
export async function GET() {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br"
  const { products, live } = await getCatalog()
  const today = new Date()
  const files = [
    { url: `${site}/sitemaps/paginas.xml`, lastModified: today },
    ...(live
      ? Array.from({ length: productChunks(products.length) }, (_, i) => ({
          url: `${site}/sitemaps/produtos-${i + 1}.xml`,
          lastModified: today,
        }))
      : []),
  ]
  return new Response(sitemapIndexXml(files), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600, stale-while-revalidate=7200",
    },
  })
}
