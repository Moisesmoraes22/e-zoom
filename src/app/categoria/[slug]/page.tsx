import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ListingFallback } from "@/components/listing-fallback"
import { SearchResults } from "@/components/search-results"
import { SiteFooter } from "@/components/site-footer"
import { CATEGORIES } from "@/lib/mock-data"
import { categoryCounts } from "@/lib/deals"
import { breadcrumbJsonLd, itemListJsonLd, serializeJsonLd } from "@/lib/structured-data"
import { getCatalog } from "@/lib/offers"
import { PAGE_SIZE, sortProducts, toSearchItem } from "@/lib/search"

export const revalidate = 1800

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) return { title: "Categoria não encontrada" }
  const { products, live } = await getCatalog()
  const count = products.filter((p) => p.category === slug).length
  return {
    title: `Ofertas de ${category.name}`,
    description:
      live && count > 0
        ? `${count} ${count === 1 ? "oferta" : "ofertas"} de ${category.name} do Mercado Livre, da Shopee e da Amazon, com preço, desconto e histórico.`
        : `Ofertas de ${category.name} nas lojas parceiras do E-Zooom.`,
  }
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) notFound()
  const { products, live } = await getCatalog()
  // Only this category travels with the page: it is the only one the list can show.
  const inCategory = products.filter((p) => p.category === category.slug)
  const seedCards = sortProducts(inCategory, "relevance").slice(0, PAGE_SIZE)
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br"

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      {live && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(
                breadcrumbJsonLd([["Início", "/"], [category.name, `/categoria/${category.slug}`]], site),
              ),
            }}
          />
          {seedCards.length > 0 && (
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: serializeJsonLd(itemListJsonLd(seedCards, site)) }}
            />
          )}
        </>
      )}
      <Suspense
        fallback={
          <ListingFallback title={`Ofertas em ${category.name}`} total={inCategory.length} cards={seedCards} />
        }
      >
        <SearchResults
          categories={categoryCounts(products)}
          products={inCategory.map(toSearchItem)}
          seedCards={seedCards}
          categorySlug={category.slug}
          categoryName={category.name}
        />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
