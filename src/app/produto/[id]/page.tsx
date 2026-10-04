import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Flame, Tags } from "lucide-react"

import { DealsCarousel } from "@/components/deals-carousel"
import { ProductDetail } from "@/components/product-detail"
import { SiteFooter } from "@/components/site-footer"
import { byDiscount, sameCategory } from "@/lib/deals"
import { ALL_PRODUCTS, getProductOffers, STORES } from "@/lib/mock-data"
import type { Product } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { getCatalog, getPriceStats } from "@/lib/offers"

export const revalidate = 300

export async function generateStaticParams() {
  const { products } = await getCatalog()
  return products.map((product) => ({ id: product.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const { products } = await getCatalog()
  const product = products.find((p) => p.id === id) ?? ALL_PRODUCTS.find((p) => p.id === id)
  if (!product) return { title: "Oferta não encontrada" }
  return {
    title: product.title,
    description: `${product.title} por ${formatCurrency(product.price)} em ${STORES[product.store].name}. Veja o histórico de preço e vá direto para a loja.`,
    openGraph: { images: [product.image] },
  }
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { products, live } = await getCatalog()
  // The header's mega menu still links to mock products, so keep those pages alive.
  const product =
    products.find((p) => p.id === id) ?? ALL_PRODUCTS.find((p) => p.id === id)
  if (!product) notFound()

  const isLive = live && products.includes(product)
  const stats = isLive ? await getPriceStats(product.id) : null
  const toOffer = (p: Product) => ({
    store: p.store,
    price: p.price,
    originalPrice: p.originalPrice,
    affiliateUrl: p.affiliateUrl,
    isFreeShipping: p.isFreeShipping,
  })
  // Other stores' offers count only when the database says it is the SAME product
  // (a shared product_id). Similar titles are never enough. Today nothing shares
  // an id, so live pages show one offer; the "Onde comprar" table appears by itself
  // once the collectors fill product_id.
  const siblings =
    isLive && product.productId
      ? products
          .filter((p) => p.productId === product.productId && p.store !== product.store)
          .sort((a, b) => a.price - b.price)
      : []
  const offers = isLive ? [product, ...siblings].map(toOffer) : getProductOffers(product)

  // Suggestions use real offers only (never the sample data) and hide below 3 cards.
  const similar = isLive ? sameCategory(product, products) : []
  const shown = new Set([product.id, ...similar.map((p) => p.id)])
  const more = isLive ? byDiscount(products.filter((p) => !shown.has(p.id))).slice(0, 8) : []

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <ProductDetail product={product} offers={offers} stats={stats} />
      {similar.length >= 3 && (
        <DealsCarousel
          products={similar}
          title="Ofertas parecidas"
          subtitle="Da mesma categoria, com preço próximo ao deste produto."
          icon={<Tags className="h-5 w-5" aria-hidden />}
        />
      )}
      {more.length >= 3 && (
        <DealsCarousel
          products={more}
          title="Mais ofertas com desconto"
          subtitle="Outras ofertas com queda de preço registrada."
          icon={<Flame className="h-5 w-5" aria-hidden />}
        />
      )}
      <SiteFooter />
    </main>
  )
}
