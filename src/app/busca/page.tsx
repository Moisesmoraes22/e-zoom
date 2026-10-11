import { Suspense } from "react"

import { ListingFallback } from "@/components/listing-fallback"
import { SearchResults } from "@/components/search-results"
import { SiteFooter } from "@/components/site-footer"
import { categoryCounts } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"
import { PAGE_SIZE, sortProducts, toSearchItem } from "@/lib/search"

export const metadata = {
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
        <SearchResults
          products={products.map(toSearchItem)}
          seedCards={seedCards}
          categories={categoryCounts(products)}
        />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
