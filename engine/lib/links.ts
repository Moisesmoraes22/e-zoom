import type { StoreId } from "../types.ts"

const SHORTENER_HOSTS = new Set([
  "amzn.to",
  "link.amazon",
  "a.co",
  "meli.la",
  "s.shopee.com.br",
  "shope.ee",
  "shp.ee",
])

export interface CanonicalLink {
  store_id: StoreId
  external_id: string
  /** Clean product URL with every query param (including other people's affiliate tags) removed. */
  url: string
}

export function isShortLink(url: string) {
  try {
    return SHORTENER_HOSTS.has(new URL(url).hostname)
  } catch {
    return false
  }
}

/** Follows redirects of a short link and returns the final URL (or the input on failure). */
export async function resolveShortLink(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; HibridLinkBot/1.0)" },
    })
    await response.body?.cancel()
    return response.url || url
  } catch {
    return url
  }
}

/**
 * Identifies the store and product id, and rebuilds a clean URL.
 * Dropping the query string matters: promo channels use their own
 * affiliate tags, and keeping them would pay the channel owner.
 */
export function canonicalize(rawUrl: string): CanonicalLink | null {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, "")

  if (host.endsWith("mercadolivre.com.br") || host.endsWith("mercadolibre.com")) {
    const match = url.pathname.match(/MLB-?(\d{6,})/i)
    if (!match) return null
    return {
      store_id: "mercado_livre",
      external_id: `MLB${match[1]}`,
      url: `${url.origin}${url.pathname}`,
    }
  }

  if (host.endsWith("amazon.com.br")) {
    const match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
    if (!match) return null
    const asin = match[1].toUpperCase()
    return {
      store_id: "amazon",
      external_id: asin,
      url: `https://www.amazon.com.br/dp/${asin}`,
    }
  }

  if (host.endsWith("shopee.com.br")) {
    const match = url.pathname.match(/i\.(\d+)\.(\d+)/) ??
      url.pathname.match(/product\/(\d+)\/(\d+)/)
    if (!match) return null
    return {
      store_id: "shopee",
      external_id: `${match[1]}.${match[2]}`,
      url: `https://shopee.com.br/product/${match[1]}/${match[2]}`,
    }
  }

  return null
}

/**
 * Builds YOUR affiliate link from the clean URL. Amazon's `tag` is the
 * documented Associates parameter; ML and Shopee use a template you copy
 * from their affiliate tools ("{url}" is replaced by the clean URL).
 */
export function buildAffiliateUrl(
  link: CanonicalLink,
  env: NodeJS.ProcessEnv,
): string | null {
  if (link.store_id === "amazon") {
    return env.AMAZON_ASSOCIATE_TAG
      ? `${link.url}?tag=${encodeURIComponent(env.AMAZON_ASSOCIATE_TAG)}`
      : null
  }
  const template =
    link.store_id === "mercado_livre"
      ? env.ML_AFFILIATE_URL_TEMPLATE
      : env.SHOPEE_AFFILIATE_URL_TEMPLATE
  return template ? template.replace("{url}", link.url) : null
}
