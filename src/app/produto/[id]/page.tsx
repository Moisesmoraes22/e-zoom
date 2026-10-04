import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ProductDetail } from "@/components/product-detail"
import { SiteFooter } from "@/components/site-footer"
import { ALL_PRODUCTS, getProductOffers, STORES } from "@/lib/mock-data"
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

  // Live products have a single real offer; the cross-store comparison is mock-only.
  const isLive = live && products.includes(product)
  const stats = isLive ? await getPriceStats(product.id) : null
  const offers =
    isLive
      ? [
          {
            store: product.store,
            price: product.price,
            originalPrice: product.originalPrice,
            affiliateUrl: product.affiliateUrl,
            isFreeShipping: product.isFreeShipping,
          },
        ]
      : getProductOffers(product)

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <ProductDetail product={product} offers={offers} stats={stats} />
      <SiteFooter />
    </main>
  )
}
