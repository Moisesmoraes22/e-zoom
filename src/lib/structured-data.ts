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
    // Built only from what the page shows: the name, the store and the price (and free shipping, when the store says so).
    description: `${product.title}. Oferta no ${STORE_NAMES[product.store]} por R$ ${product.price.toFixed(2).replace(".", ",")}${product.isFreeShipping ? ", com frete grátis" : ""}. A compra é feita na loja.`,
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
      // Only when the store marks the offer as free shipping. Return policy and GTIN are not known to us, so they are not claimed.
      ...(product.isFreeShipping
        ? {
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "BRL" },
              shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
            },
          }
        : {}),
    },
  }
}

/** schema.org BreadcrumbList: `trail` is [name, path] pairs from the home page down. */
export function breadcrumbJsonLd(trail: [name: string, path: string][], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      item: `${siteUrl}${path}`,
    })),
  }
}

/** schema.org ItemList of a category's first offers (links only, as the page shows them). */
export function itemListJsonLd(products: Pick<Product, "id" | "title">[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${siteUrl}/produto/${p.id}`,
      name: p.title,
    })),
  }
}

/** JSON for a <script type="application/ld+json">: "<" is escaped so a title can never close the tag. */
/** The site as a whole: its name and the search box Google may show under the result. */
export function siteJsonLd(siteUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "E-Zooom",
      url: siteUrl,
      inLanguage: "pt-BR",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/busca?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    { "@context": "https://schema.org", "@type": "Organization", name: "E-Zooom", url: siteUrl, logo: `${siteUrl}/brand/email-logo.png` },
  ]
}

export const serializeJsonLd = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c")
