import type { Connector, OfferRow } from "../types.ts"

const API = "https://api.mercadolibre.com"

/** Search terms per site category. Tune freely; each term is one API call. */
const QUERIES: Record<string, string[]> = {
  eletronicos: ["fone bluetooth", "smartwatch", "carregador"],
  casa: ["air fryer", "cadeira escritorio", "aspirador"],
  games: ["controle ps5", "headset gamer"],
  calcados: ["tenis masculino", "tenis feminino"],
  esporte: ["bicicleta", "esteira"],
  beleza: ["perfume", "secador de cabelo"],
}

interface MlSearchItem {
  id: string
  title: string
  price: number
  original_price: number | null
  thumbnail: string | null
  permalink: string
  condition?: string
  shipping?: { free_shipping?: boolean }
}

/**
 * Pure mapping from a Mercado Livre search item to an offer row.
 * Returns null for anything that isn't a real, discounted, new item.
 */
export function mapMlItem(
  item: MlSearchItem,
  categorySlug: string,
  buildAffiliateUrl: (url: string) => string | null,
): OfferRow | null {
  if (item.condition && item.condition !== "new") return null
  if (!item.original_price || item.original_price <= item.price) return null
  if (!(item.price > 0)) return null

  return {
    store_id: "mercado_livre",
    external_id: item.id,
    title: item.title,
    image: item.thumbnail
      ? item.thumbnail.replace(/^http:/, "https:").replace("-I.jpg", "-O.jpg")
      : null,
    category_slug: categorySlug,
    price: item.price,
    original_price: item.original_price,
    url: item.permalink,
    affiliate_url: buildAffiliateUrl(item.permalink),
    is_free_shipping: item.shipping?.free_shipping ?? false,
    source: "api",
  }
}

/**
 * Affiliate links come from a template in ML_AFFILIATE_URL_TEMPLATE, e.g.
 * "{url}?your_param=your_value", copied from what the Mercado Livre
 * affiliate tool generates for you. Unset means no affiliate link yet.
 */
function makeAffiliateBuilder(template: string | undefined) {
  return (url: string) => (template ? template.replace("{url}", url) : null)
}

async function getToken(clientId: string, clientSecret: string) {
  const response = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!response.ok) {
    throw new Error(`ML auth failed: ${response.status} ${await response.text()}`)
  }
  return ((await response.json()) as { access_token: string }).access_token
}

export function createMercadoLivreConnector(env: NodeJS.ProcessEnv): Connector {
  const { ML_CLIENT_ID, ML_CLIENT_SECRET, ML_AFFILIATE_URL_TEMPLATE } = env

  return {
    name: "mercadolivre",
    async fetchOffers() {
      if (!ML_CLIENT_ID || !ML_CLIENT_SECRET) {
        throw new Error(
          "Missing ML_CLIENT_ID / ML_CLIENT_SECRET (register an app at developers.mercadolivre.com.br)",
        )
      }
      const token = await getToken(ML_CLIENT_ID, ML_CLIENT_SECRET)
      const buildAffiliateUrl = makeAffiliateBuilder(ML_AFFILIATE_URL_TEMPLATE)
      const offers = new Map<string, OfferRow>()

      for (const [category, terms] of Object.entries(QUERIES)) {
        for (const term of terms) {
          const response = await fetch(
            `${API}/sites/MLB/search?q=${encodeURIComponent(term)}&limit=50`,
            { headers: { authorization: `Bearer ${token}` } },
          )
          if (!response.ok) {
            throw new Error(`ML search "${term}" failed: ${response.status}`)
          }
          const { results } = (await response.json()) as {
            results: MlSearchItem[]
          }
          for (const item of results) {
            const row = mapMlItem(item, category, buildAffiliateUrl)
            if (row) offers.set(row.external_id, row)
          }
        }
      }
      return [...offers.values()]
    },
  }
}
