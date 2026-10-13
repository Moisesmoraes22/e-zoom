import type { Metadata } from "next"
import { Suspense } from "react"

import { ListingFallback } from "@/components/listing-fallback"
import { SearchLoader } from "@/components/search-loader"
import { SiteFooter } from "@/components/site-footer"
import { categoryCounts } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"
import { PAGE_SIZE, sortProducts } from "@/lib/search"

// Internal search results are endless thin variations of the catalogue: out of the index, links still followed.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Buscar ofertas",
  description:
    "Pesquise ofertas do Mercado Livre, da Shopee e da Amazon, filtre por categoria, loja, preço e desconto.",
}

export const revalidate = 1800

export default async function BuscaPage() {
  const { products } = await getCatalog()
  const seedCards = sortProducts(products, "relevance").slice(0, PAGE_SIZE)
  return (
    <main id="conteudo" className="min-h-screen bg-background">
      {/* The fallback is what the static HTML carries: the title and the first offers, as links. */}
      <Suspense fallback={<ListingFallback title="Todas as ofertas" total={products.length} cards={seedCards} />}>
        <SearchLoader seedCards={seedCards} categories={categoryCounts(products)} total={products.length} />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
