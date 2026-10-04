import type { Connector, OfferRow } from "../types.ts"

const API = "https://api.mercadolibre.com"
const PER_CATEGORY = 15

/**
 * Our category slug -> Mercado Livre category ids. We read each category's
 * best sellers (/highlights): the public keyword search (/sites/MLB/search)
 * answers 403 for new apps, while highlights and catalog endpoints work.
 */
const CATEGORIES: Record<string, string[]> = {
  eletronicos: ["MLB1000", "MLB1648", "MLB1051"],
  casa: ["MLB1574", "MLB5726"],
  moda: ["MLB1430"],
  beleza: ["MLB1246"],
  esporte: ["MLB1276"],
  games: ["MLB1144"],
  infantil: ["MLB1384", "MLB1132"],
}

interface MlProduct {
  name: string
  pictures?: { url: string }[]
}

interface MlProductItem {
  price: number
  original_price: number | null
  condition?: string
  shipping?: { free_shipping?: boolean }
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
      const get = async <T>(path: string): Promise<T> => {
        const response = await fetch(`${API}${path}`, {
          headers: { authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`ML ${path} failed: ${response.status}`)
        return (await response.json()) as T
      }

      const offers = new Map<string, OfferRow>()

      const buildOffer = async (id: string, category: string) => {
        const [product, { results }] = await Promise.all([
          get<MlProduct>(`/products/${id}`),
          get<{ results: MlProductItem[] }>(`/products/${id}/items?limit=10`),
        ])
        const image = product.pictures?.[0]?.url
        // Cheapest new listing of this catalog product.
        const best = results
          .filter((item) => item.condition === "new" && item.price > 0)
          .sort((a, b) => a.price - b.price)[0]
        if (!best || !image || !product.name) return

        const url = `https://www.mercadolivre.com.br/p/${id}`
        offers.set(id, {
          store_id: "mercado_livre",
          external_id: id,
          title: product.name,
          image: image.replace(/^http:/, "https:"),
          category_slug: category,
          price: best.price,
          original_price:
            best.original_price && best.original_price > best.price
              ? best.original_price
              : null,
          url,
          affiliate_url: ML_AFFILIATE_URL_TEMPLATE
            ? ML_AFFILIATE_URL_TEMPLATE.replace("{url}", url)
            : null,
          is_free_shipping: best.shipping?.free_shipping ?? false,
          source: "api",
        })
      }

      for (const [category, mlIds] of Object.entries(CATEGORIES)) {
        for (const mlId of mlIds) {
          const { content } = await get<{ content: { id: string; type: string }[] }>(
            `/highlights/MLB/category/${mlId}`,
          )
          const ids = content
            .filter((entry) => entry.type === "PRODUCT" && !offers.has(entry.id))
            .slice(0, PER_CATEGORY)
          // Small batches keep us well under the API rate limit.
          for (let i = 0; i < ids.length; i += 5) {
            await Promise.allSettled(
              ids.slice(i, i + 5).map((entry) => buildOffer(entry.id, category)),
            )
          }
          console.log(`[mercadolivre] ${category}/${mlId}: ${offers.size} ofertas até agora`)
        }
      }
      return [...offers.values()]
    },
  }
}
