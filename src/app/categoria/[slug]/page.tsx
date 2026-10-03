import { notFound } from "next/navigation"
import { Suspense } from "react"

import { SearchResults } from "@/components/search-results"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { CATEGORIES } from "@/lib/mock-data"
import { getCatalog } from "@/lib/offers"

export const revalidate = 300

export function generateStaticParams() {
  return CATEGORIES.map((category) => ({ slug: category.slug }))
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = CATEGORIES.find((c) => c.slug === slug)
  if (!category) notFound()
  const { products } = await getCatalog()

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <Suspense fallback={null}>
        <SearchResults
          products={products}
          categorySlug={category.slug}
          categoryName={category.name}
        />
      </Suspense>
      <SiteFooter />
    </main>
  )
}
