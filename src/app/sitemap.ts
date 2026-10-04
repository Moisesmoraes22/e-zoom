import type { MetadataRoute } from "next"

import { categoryCounts } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hibridlink-promos.vercel.app"
  const { products, live } = await getCatalog()

  const pages: MetadataRoute.Sitemap = [
    { url: `${site}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${site}/busca`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${site}/categorias`, changeFrequency: "daily", priority: 0.7 },
    ...categoryCounts(products).map((c) => ({
      url: `${site}/categoria/${c.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.7,
    })),
  ]
  // Sample data must never be advertised to search engines.
  if (!live) return pages

  return [
    ...pages,
    ...products.map((p) => ({
      url: `${site}/produto/${p.id}`,
      lastModified: p.seenAt,
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ]
}
