import { Suspense } from "react"

import { SearchResults } from "@/components/search-results"
import { SiteFooter } from "@/components/site-footer"
import { getCatalog } from "@/lib/offers"

export const metadata = {
  title: "Buscar ofertas — HibridLink",
}

export const revalidate = 300

export default async function BuscaPage() {
  const { products } = await getCatalog()
  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <SearchResults products={products} />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
