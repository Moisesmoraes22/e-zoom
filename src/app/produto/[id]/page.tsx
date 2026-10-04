import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductDetail } from "@/components/product-detail"
import { SiteFooter } from "@/components/site-footer"
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

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <ProductDetail product={product} offers={offers} stats={stats} />
      <SiteFooter />
    </main>
  )
}
