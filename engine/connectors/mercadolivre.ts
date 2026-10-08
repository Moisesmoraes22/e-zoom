import { isTool, refineCategory } from "../lib/categories.ts"
import { isDj } from "../lib/dj.ts"
import { mlSellerLocation, type SellerLocation } from "../lib/location.ts"
import { mlSellerLeader, type SellerLeader } from "../lib/seller.ts"
import { isSupplement } from "../lib/supplements.ts"
import type { Connector, OfferRow } from "../types.ts"

const API = "https://api.mercadolibre.com"
const PER_CATEGORY = 20
// Wide mode (ML_WIDE=1): also read the best sellers of every sub-category, a few per node, up to a
// ceiling PER CATEGORY so the last categories of the list are never left empty by the first ones.
const PER_NODE = 4
const WIDE_PER_CATEGORY = 60
const WIDE_MAX = 3300

/** Supplement niche: catalog search (not best sellers), so we get far more than 20 per node. */
const SUPPLEMENT_TERMS = [
  "whey protein", "whey isolado", "creatina", "bcaa", "glutamina", "pré treino", "hipercalórico",
  "albumina", "caseína", "colágeno", "multivitamínico", "ômega 3", "termogênico", "beta alanina",
  "vitamina d", "magnésio", "pasta de amendoim", "barra de proteína",
]
/** DJ niche: controllers, mixers, CDJs, turntables, monitors, cables, interfaces, PA, lights. */
const DJ_TERMS = [
  "controladora dj", "pioneer ddj", "numark", "mixer dj", "cdj pioneer", "toca discos", "fone dj",
  "fone de ouvido profissional estudio", "cabo xlr", "cabo p10", "cabo rca", "interface de audio",
  "microfone dinamico", "caixa ativa", "moving head", "maquina de fumaça", "pedestal caixa de som",
  "mesa de som", "monitor de estudio", "behringer", "rekordbox", "case controladora dj",
]
/** Tools niche: power and hand tools, measuring, air and cutting; the highlights alone give too few. */
const TOOL_TERMS = [
  "furadeira de impacto", "parafusadeira sem fio", "furadeira parafusadeira", "esmerilhadeira angular", "serra circular",
  "serra tico tico", "lixadeira", "jogo de chaves", "jogo de soquetes", "maleta de ferramentas", "kit de ferramentas",
  "alicate", "trena a laser", "multímetro", "nível a laser", "compressor de ar", "soprador térmico", "chave de impacto",
  "tupia", "politriz", "morsa", "martelo", "chave de fenda", "caixa de ferramentas",
]
const PER_TERM = 25 // offers kept per term
// Most catalog hits have no active seller (items -> 404), so we scan a few pages per term.
const SEARCH_PAGES = 3
const SEARCH_PAGE_SIZE = 50

/**
 * Our category slug -> Mercado Livre category ids: the same root categories the marketplace shows,
 * each filled with its best sellers (/highlights). The public keyword search (/sites/MLB/search)
 * answers 403 for new apps, while highlights and catalog endpoints work. Not collected: Carros e Motos,
 * Imóveis, Ingressos and Serviços (no highlights, not products), and "Mais categorias" (a grab bag).
 * Supplements and DJ are our own niches, filled by the catalog searches below.
 */
const CATEGORIES: Record<string, string[]> = {
  eletronicos: ["MLB1000"],
  informatica: ["MLB1648"],
  celulares: ["MLB1051"],
  casa: ["MLB1574"],
  eletrodomesticos: ["MLB5726"],
  moda: ["MLB1430"],
  beleza: ["MLB1246"],
  saude: ["MLB264586"],
  esporte: ["MLB1276"],
  games: ["MLB1144"],
  bebes: ["MLB1384"],
  brinquedos: ["MLB1132"],
  "acessorios-veiculos": ["MLB5672"],
  agro: ["MLB271599"],
  "alimentos-bebidas": ["MLB1403"],
  animais: ["MLB1071"],
  antiguidades: ["MLB1367"],
  "arte-papelaria": ["MLB1368"],
  cameras: ["MLB1039"],
  construcao: ["MLB1500"],
  ferramentas: ["MLB263532"],
  festas: ["MLB12404"],
  industria: ["MLB1499"],
  instrumentos: ["MLB1182"],
  "joias-relogios": ["MLB3937"],
  livros: ["MLB1196"],
  "musica-filmes": ["MLB1168"],
}

interface MlProduct {
  name: string
  pictures?: { url: string }[]
}

interface MlProductItem {
  seller_id?: number
  price: number
  original_price: number | null
  condition?: string
  shipping?: { free_shipping?: boolean }
  seller_address?: { city?: { name?: string | null } | null; state?: { name?: string | null } | null } | null
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
      // One /users call per seller and run: many offers share a seller. A failed call just means no badge.
      const leaders = new Map<number, SellerLeader | null>()
      const leaderOf = async (sellerId?: number) => {
        if (!sellerId) return null
        if (!leaders.has(sellerId)) {
          leaders.set(sellerId, await get<Parameters<typeof mlSellerLeader>[0]>(`/users/${sellerId}`).then(mlSellerLeader).catch(() => null))
        }
        return leaders.get(sellerId) ?? null
      }

      const buildOffer = async (id: string, categoryIn: string, only?: "suplementos" | "dj" | "ferramentas") => {
        // Supplement search hits are mostly sellerless: check listings first, skip the rest.
        const { results } = await get<{ results: MlProductItem[] }>(`/products/${id}/items?limit=10`)
        const product = await get<MlProduct>(`/products/${id}`)
        const image = product.pictures?.[0]?.url
        // Cheapest new listing of this catalog product.
        const sellers = results
          .filter((item) => item.condition === "new" && item.price > 0)
          .sort((a, b) => a.price - b.price)
        // A seller far below everyone else (under half of the next one) is usually a
        // reseller of codes/gift cards or a typo, and makes the price flip between runs.
        // ponytail: with a single seller there is nothing to compare, it is kept as is.
        const best = sellers[1] && sellers[0].price < sellers[1].price * 0.5 ? sellers[1] : sellers[0]
        if (!best || !image || !product.name) return
        const supplement = isSupplement(product.name)
        const dj = !supplement && isDj(product.name)
        if (only === "suplementos" && !supplement) return
        if (only === "dj" && !dj) return
        // A catalog search for "alicate" also finds nail clippers: keep only what is named as a tool.
        if (only === "ferramentas" && !isTool(product.name)) return
        const category = supplement ? "suplementos" : dj ? "dj" : refineCategory(product.name, categoryIn)

        const url = `https://www.mercadolivre.com.br/p/${id}`
        const location: SellerLocation = mlSellerLocation(best.seller_address)
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
          seller_state: location.state,
          seller_city: location.city,
          seller_leader: await leaderOf(best.seller_id),
          images: (product.pictures ?? []).map((p) => p.url.replace(/^http:/, "https:")).slice(0, 8),
          source: "api",
        })
      }

      const wide = env.ML_WIDE === "1"
      const nodesOf = async (mlId: string) => {
        if (!wide) return [mlId]
        const { children_categories = [] } = await get<{ children_categories?: { id: string }[] }>(
          `/categories/${mlId}`,
        )
        return [mlId, ...children_categories.map((c) => c.id)]
      }

      // ML_ONLY=dj (or suplementos) runs just that niche, handy to check it without a full collection.
      const only = env.ML_ONLY
      for (const term of !only || only === "suplementos" ? SUPPLEMENT_TERMS : []) {
        const before = offers.size
        for (let page = 0; page < SEARCH_PAGES && offers.size - before < PER_TERM; page++) {
          const { results = [] } = await get<{ results: { id: string }[] }>(
            `/products/search?status=active&site_id=MLB&limit=${SEARCH_PAGE_SIZE}&offset=${page * SEARCH_PAGE_SIZE}&q=${encodeURIComponent(term)}`,
          ).catch(() => ({ results: [] }))
          const ids = results.map((r) => r.id).filter((id) => !offers.has(id))
          for (let i = 0; i < ids.length && offers.size - before < PER_TERM; i += 10) {
            await Promise.allSettled(ids.slice(i, i + 10).map((id) => buildOffer(id, "suplementos", "suplementos")))
          }
        }
        console.log(`[mercadolivre] suplementos/${term}: ${offers.size} ofertas até agora`)
      }

      // DJ niche: same catalog search, one pass per term.
      for (const term of !only || only === "dj" ? DJ_TERMS : []) {
        const before = offers.size
        for (let page = 0; page < SEARCH_PAGES && offers.size - before < PER_TERM; page++) {
          const { results = [] } = await get<{ results: { id: string }[] }>(
            `/products/search?status=active&site_id=MLB&limit=${SEARCH_PAGE_SIZE}&offset=${page * SEARCH_PAGE_SIZE}&q=${encodeURIComponent(term)}`,
          ).catch(() => ({ results: [] }))
          const ids = results.map((r) => r.id).filter((id) => !offers.has(id))
          for (let i = 0; i < ids.length && offers.size - before < PER_TERM; i += 10) {
            await Promise.allSettled(ids.slice(i, i + 10).map((id) => buildOffer(id, "dj", "dj")))
          }
        }
        console.log(`[mercadolivre] dj/${term}: ${offers.size} ofertas até agora`)
      }

      // Tools niche: same catalog search, one pass per term (ML_ONLY=ferramentas runs just this).
      for (const term of !only || only === "ferramentas" ? TOOL_TERMS : []) {
        const before = offers.size
        for (let page = 0; page < SEARCH_PAGES && offers.size - before < PER_TERM; page++) {
          const { results = [] } = await get<{ results: { id: string }[] }>(
            `/products/search?status=active&site_id=MLB&limit=${SEARCH_PAGE_SIZE}&offset=${page * SEARCH_PAGE_SIZE}&q=${encodeURIComponent(term)}`,
          ).catch(() => ({ results: [] }))
          const ids = results.map((r) => r.id).filter((id) => !offers.has(id))
          for (let i = 0; i < ids.length && offers.size - before < PER_TERM; i += 10) {
            await Promise.allSettled(ids.slice(i, i + 10).map((id) => buildOffer(id, "ferramentas", "ferramentas")))
          }
        }
        console.log(`[mercadolivre] ferramentas/${term}: ${offers.size} ofertas até agora`)
      }

      for (const [category, mlIds] of Object.entries(only ? {} : CATEGORIES)) {
        const startedAt = offers.size
        const full = () => wide && (offers.size >= WIDE_MAX || offers.size - startedAt >= WIDE_PER_CATEGORY)
        for (const top of mlIds) {
          if (full()) break
          for (const mlId of await nodesOf(top)) {
            if (full()) break
            const limit = wide && mlId !== top ? PER_NODE : PER_CATEGORY
            // Some sub-categories have no highlights (404): skip them in wide mode.
            const { content } = await get<{ content: { id: string; type: string }[] }>(
              `/highlights/MLB/category/${mlId}`,
            ).catch((error) => {
              if (wide) return { content: [] }
              throw error
            })
            const ids = content
              .filter((entry) => entry.type === "PRODUCT" && !offers.has(entry.id))
              .slice(0, limit)
            // Small batches keep us well under the API rate limit.
            for (let i = 0; i < ids.length; i += 5) {
              await Promise.allSettled(
                ids.slice(i, i + 5).map((entry) => buildOffer(entry.id, category)),
              )
            }
            console.log(`[mercadolivre] ${category}/${mlId}: ${offers.size} ofertas até agora`)
          }
        }
      }
      return [...offers.values()]
    },
  }
}
