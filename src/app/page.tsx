import { CategoryGrid } from "@/components/category-grid"
import { DealsCarousel } from "@/components/deals-carousel"
import { FeaturedDeal } from "@/components/featured-deal"
import { ProductGrid } from "@/components/product-grid"
import { SiteFooter } from "@/components/site-footer"
import { CommerceHero } from "@/components/ui/commerce-hero"
import {
  CATEGORIES,
  DEALS,
  FEATURED_PRODUCTS,
  PRICE_DROP_PRODUCTS,
} from "@/lib/mock-data"
import { getCatalog } from "@/lib/offers"
import { calculateDiscountPercent } from "@/lib/utils"

export const revalidate = 300

export default async function Home() {
  const { products, live } = await getCatalog()
  const deals = live ? products.slice(0, 8) : DEALS
  const popular = live ? products.slice(8, 32) : FEATURED_PRODUCTS
  const priceDrops = live
    ? products.filter((p) => p.originalPrice && p.originalPrice > p.price)
    : PRICE_DROP_PRODUCTS
  const featured = [...products]
    .sort(
      (a, b) =>
        (calculateDiscountPercent(b.price, b.originalPrice) ?? 0) -
        (calculateDiscountPercent(a.price, a.originalPrice) ?? 0),
    )
    .slice(0, 5)

  return (
    <main className="bg-background">
      <CommerceHero />
      <CategoryGrid categories={CATEGORIES} />
      <FeaturedDeal products={featured} />
      <DealsCarousel products={deals} />
      {priceDrops.length > 0 && (
        <ProductGrid
          title="📉 O preço caiu"
          subtitle="Produtos que ficaram mais baratos recentemente"
          products={priceDrops}
        />
      )}
      {popular.length > 0 && (
        <ProductGrid
          title="Produtos populares"
          subtitle="Descobertas de quem já está comparando ofertas"
          products={popular}
        />
      )}
      <SiteFooter />
    </main>
  )
}
