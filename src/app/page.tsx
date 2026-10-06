import { Flame, Sparkles, Tag, TrendingDown, Zap } from "lucide-react"

import { CategoryGrid } from "@/components/category-grid"
import { DealsCarousel } from "@/components/deals-carousel"
import { ProductRow } from "@/components/product-row"
import { SiteFooter } from "@/components/site-footer"
import { InterestsSection } from "@/components/interests-section"
import { RecommendedSection } from "@/components/recommended-section"
import { PriceRangesSection } from "@/components/price-ranges-section"
import { StatsStrip } from "@/components/stats-strip"
import { StoresSection } from "@/components/stores-section"
import { CommerceHero } from "@/components/ui/commerce-hero"
import { byClicks, byFeatured, dropsInLast, byFinds, byRelevance, capPerCategory, byPriceDrop, byRecent, categoryCounts, countByStoreId } from "@/lib/deals"
import { toHeroOffer } from "@/lib/hero"
import { selectHeroOffers } from "@/lib/hero-select"
import { STORES } from "@/lib/mock-data"
import { getCatalog, getPriceStats } from "@/lib/offers"
import type { Product } from "@/lib/types"

export const revalidate = 300

const SECTION_SIZE = 9
const SHELVES = 2
const ALL_SIZE = 12
const POOL_PER_CATEGORY = 24
/** A section with fewer cards than this looks broken, so it is left out. */
const MIN_SECTION = 3

export default async function Home() {
  const { products, live } = await getCatalog()

  // Each product appears in one section only. Nothing is padded: a section with
  // no real data behind it simply disappears.
  // The hero only showcases real offers: with sample data it stays text and search.
  // Chosen once per render/revalidation; the slides rotate in the browser only.
  const heroProducts = live ? selectHeroOffers(products) : []
  const heroStats = await Promise.all(heroProducts.map((p) => getPriceStats(p.id)))
  const hero = heroProducts.map((p, i) => toHeroOffer(p, heroStats[i]))

  // Every hero slide is reserved, so the sections below never repeat any of them.
  const used = new Set<string>(heroProducts.map((p) => p.id))
  const take = (list: Product[], size = SECTION_SIZE) => {
    const picked = list.filter((p) => !used.has(p.id)).slice(0, size)
    if (picked.length < MIN_SECTION) return [] // not shown, so its products stay available
    picked.forEach((p) => used.add(p.id))
    return picked
  }
  const hot = take(byClicks(products))
  const featured = take(capPerCategory(byFeatured(products), 3))
  const priceDrops = take(byPriceDrop(products))
  const finds = take(byFinds(products))
  const recent = take(byRecent(products))
  // One shelf per busiest category, best offers first with the stores mixed.
  const shelves = categoryCounts(products)
    .slice(0, SHELVES)
    .map((c) => ({ ...c, items: take(byRelevance(products.filter((p) => p.category === c.slug))) }))
    .filter((c) => c.items.length > 0)
  const allOffers = take(byRelevance(products), ALL_SIZE)

  // Candidates for "Recomendado para você" (picked in the browser from the visitor's own
  // history): the best offers of every category, so any interest has something to match.
  const ranked = byRelevance(products)
  const perCategory = new Map<string, number>()
  const recommendPool = ranked.filter((p) => {
    const n = perCategory.get(p.category) ?? 0
    perCategory.set(p.category, n + 1)
    return n < POOL_PER_CATEGORY
  })

  const storeCounts = countByStoreId(products)
  const storeNames = (["mercado_livre", "shopee", "amazon"] as const)
    .filter((id) => storeCounts[id])
    .map((id) => STORES[id].name)

  return (
    <main id="conteudo" className="bg-background">
      <CommerceHero storeNames={storeNames} offers={hero} />
      {live && <StatsStrip offers={products.length} drops={dropsInLast(products, 24)} stores={storeNames.length} />}
      <CategoryGrid categories={categoryCounts(products).slice(0, 8)} showCounts={live} />
      {hot.length > 0 && (
        <ProductRow
          icon={<Zap className="h-5 w-5" />}
          title="Bombando agora"
          subtitle="As ofertas mais abertas pelos visitantes do E-Zoom nos últimos dias."
          products={hot}
          href="/busca"
        />
      )}
      {featured.length > 0 && (
        <ProductRow
          icon={<Flame className="h-5 w-5" />}
          title="Ofertas que valem a pena hoje"
          subtitle="Selecionadas por desconto, histórico de preço, avaliação da loja e preço visto recentemente."
          products={featured}
          href="/busca?ordenacao=desconto"
          linkLabel="Ver todas as ofertas"
        />
      )}
      {priceDrops.length > 0 && (
        <ProductRow
          icon={<TrendingDown className="h-5 w-5" />}
          title="Preço caiu"
          subtitle="Produtos que ficaram mais baratos desde a última vez que vimos o preço."
          products={priceDrops}
          href="/busca"
        />
      )}
      {finds.length > 0 && (
        <ProductRow
          icon={<Sparkles className="h-5 w-5" />}
          title="Achados E-Zoom"
          subtitle="Ofertas que merecem uma atenção especial: bem avaliadas e com bom desconto."
          products={finds}
          href="/busca?ordenacao=desconto"
          cardLabel="Achado E-Zoom"
        />
      )}
      {live && <RecommendedSection pool={recommendPool} />}
      <InterestsSection products={products} />
      <PriceRangesSection products={products} />
      {/* One navy band on the whole page (the first category); the other shelves stay on the light background. */}
      {shelves.map((c, i) => (
        <DealsCarousel
          key={c.slug}
          tone={i === 0 ? "navy" : "light"}
          products={c.items}
          title={`Ofertas em ${c.name}`}
          subtitle={`As melhores ofertas de ${c.name} agora.`}
          icon={<Tag className="h-5 w-5" aria-hidden />}
          href={`/categoria/${c.slug}`}
        />
      ))}
      {recent.length > 0 && (
        <DealsCarousel products={recent} tone="light" />
      )}
      {allOffers.length > 0 && (
        <ProductRow
          title="Todas as ofertas"
          subtitle="Explore tudo o que o E-Zoom encontrou nas lojas parceiras."
          products={allOffers}
          href="/busca"
          linkLabel="Ver todas as ofertas"
          chips={[
            { label: "Menor preço", href: "/busca?ordenacao=preco" },
            { label: "Maior desconto", href: "/busca?ordenacao=desconto" },
            { label: "Mais recentes", href: "/busca?ordenacao=recente" },
          ]}
        />
      )}
      <StoresSection counts={storeCounts} />
      <SiteFooter />
    </main>
  )
}
