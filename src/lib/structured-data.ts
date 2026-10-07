import type { Product } from "@/lib/types"

const STORE_NAMES = { mercado_livre: "Mercado Livre", shopee: "Shopee", amazon: "Amazon", telegram: "Telegram" } as const

/**
 * schema.org Product + Offer for a real, live offer (what Google shows as price in results).
 * Only facts we have: no brand, no review count and no rating are invented, and an
 * aggregate rating is left out unless the number of reviews is known too.
 */
export function productJsonLd(product: Product, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: [product.image],
    sku: product.id,
    ...(product.reviewsCount && product.rating
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewsCount } }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/produto/${product.id}`,
      priceCurrency: "BRL",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: STORE_NAMES[product.store] },
    },
  }
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so a title can never close the tag. */
export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")
