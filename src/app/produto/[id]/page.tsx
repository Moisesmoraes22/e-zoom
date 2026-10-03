import { notFound } from "next/navigation"

import { ProductDetail } from "@/components/product-detail"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { ALL_PRODUCTS, getProductOffers } from "@/lib/mock-data"
import { getCatalog } from "@/lib/offers"

export const revalidate = 300

export async function generateStaticParams() {
  const { products } = await getCatalog()
  return products.map((product) => ({ id: product.id }))
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
  const offers =
    live && products.includes(product)
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
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <ProductDetail product={product} offers={offers} />
      <SiteFooter />
    </main>
  )
}
