import { Flame, TrendingDown } from "lucide-react"

import { CategoryGrid } from "@/components/category-grid"
import { DealsCarousel } from "@/components/deals-carousel"
import { ProductGrid } from "@/components/product-grid"
import { SiteFooter } from "@/components/site-footer"
import { StoresSection } from "@/components/stores-section"
import { CommerceHero } from "@/components/ui/commerce-hero"
import { byDiscount, byRecent, categoryCounts, countByStoreId } from "@/lib/deals"
import { pickHeroOffer, toHeroOffer } from "@/lib/hero"
import { STORES } from "@/lib/mock-data"
import { getCatalog, getPriceStats } from "@/lib/offers"
import type { Product } from "@/lib/types"

export const revalidate = 300

const SECTION_SIZE = 8

export default async function Home() {
  const { products, live } = await getCatalog()

  // Each product appears in one section only. Nothing is padded: a section with
  // no real data behind it simply disappears.
  // The hero only showcases real offers: with sample data it stays text and search.
  const heroProduct = live ? pickHeroOffer(products) : null
  const hero = heroProduct
    ? toHeroOffer(heroProduct, await getPriceStats(heroProduct.id))
    : null

  const used = new Set<string>(heroProduct ? [heroProduct.id] : [])
  const take = (list: Product[]) => {
    const picked = list.filter((p) => !used.has(p.id)).slice(0, SECTION_SIZE)
    picked.forEach((p) => used.add(p.id))
    return picked
  }
  const featured = take(byDiscount(products))
  const priceDrops = take(products.filter((p) => p.isPriceDrop))
  const recent = take(byRecent(products))

  const storeCounts = countByStoreId(products)
  const storeNames = (["mercado_livre", "shopee", "amazon"] as const)
    .filter((id) => storeCounts[id])
    .map((id) => STORES[id].name)

  return (
    <main id="conteudo" className="bg-background">
      <CommerceHero storeNames={storeNames} offer={hero} />
      {featured.length > 0 && (
        <ProductGrid
          icon={<Flame className="h-5 w-5" />}
          title="Ofertas em destaque"
          subtitle="Algumas das melhores oportunidades encontradas recentemente."
          products={featured}
          href="/busca?ordenacao=desconto"
          linkLabel="Ver todas as ofertas"
        />
      )}
      {priceDrops.length > 0 && (
        <ProductGrid
          icon={<TrendingDown className="h-5 w-5" />}
          title="O preço caiu"
          subtitle="Produtos que ficaram mais baratos desde que começamos a acompanhar."
          products={priceDrops}
          href="/busca"
        />
      )}
      <CategoryGrid categories={categoryCounts(products).slice(0, 8)} showCounts={live} />
      {recent.length > 0 && (
        <DealsCarousel products={recent} />
      )}
      <StoresSection counts={storeCounts} />
      <SiteFooter />
    </main>
  )
}
