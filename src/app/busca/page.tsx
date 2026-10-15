import type { Metadata } from "next"
import { Suspense } from "react"

import { ListingFallback } from "@/components/listing-fallback"
import { SearchLoader } from "@/components/search-loader"
import { SiteFooter } from "@/components/site-footer"
import { categoryCounts } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"
import { EMPTY_FILTERS, filterProducts, PAGE_SIZE, sortProducts } from "@/lib/search"
import type { Product } from "@/lib/types"

// Internal search results are endless thin variations of the catalogue: out of the index, links still followed.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Buscar ofertas",
  description:
    "Pesquise ofertas do Mercado Livre, da Shopee e da Amazon, filtre por categoria, loja, preço e desconto.",
}

// Ranking the whole catalogue for the empty search is done once per catalogue read, not per visit.
let genericSeed: { catalogue: Product[]; cards: Product[] } | null = null
function genericCards(products: Product[]) {
  if (genericSeed?.catalogue !== products) {
    genericSeed = { catalogue: products, cards: sortProducts(products, "relevance").slice(0, PAGE_SIZE) }
  }
  return genericSeed.cards
}

/**
 * The first page of THE search the visitor typed is computed here, on the server, and arrives with the
 * page: the results show at once. The full list (filters, sort, more pages) loads right after in the
 * browser and takes over. Before, the page showed a generic list for several seconds while that list
 * downloaded, and it looked as if the search had not been applied.
 */
export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 80) ?? ""
  const { products } = await getCatalog()

  let seedCards: Product[]
  let total: number
  if (query) {
    const found = filterProducts(products, { ...EMPTY_FILTERS, query })
    seedCards = sortProducts(found, "relevance", query).slice(0, PAGE_SIZE)
    total = found.length
  } else {
    seedCards = genericCards(products)
    total = products.length
  }

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      {/* The fallback is what the HTML carries: the title and the first offers of this search, as links. */}
      <Suspense fallback={<ListingFallback title={query ? `Ofertas para “${query}”` : "Todas as ofertas"} total={total} cards={seedCards} searching={!!query && total === 0} loadingMore />}>
        <SearchLoader seedCards={seedCards} categories={categoryCounts(products)} total={total} query={query} />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
