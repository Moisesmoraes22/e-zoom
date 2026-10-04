import type { Metadata } from "next"

import { CategoryGrid } from "@/components/category-grid"
import { SiteFooter } from "@/components/site-footer"
import { categoryCounts } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Categorias de ofertas",
  description:
    "Navegue pelas ofertas do HibridLink por tipo de produto: eletrônicos, casa, games, beleza e mais.",
}

export default async function CategoriasPage() {
  const { products, live } = await getCatalog()
  const categories = categoryCounts(products)

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 pt-10">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Navegue pelas ofertas por tipo de produto.
        </p>
      </div>
      {categories.length > 0 ? (
        <CategoryGrid
          categories={categories}
          showCounts={live}
          withHeader={false}
          gridClassName="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        />
      ) : (
        <p className="container mx-auto max-w-7xl px-4 py-12 text-muted-foreground">
          Ainda não há ofertas por categoria. Volte em instantes.
        </p>
      )}
      <SiteFooter />
    </main>
  )
}
