import { createHash } from "node:crypto"

import { isArtBrush, isBook, isDermocosmetico, isErvas, isGpu, isHigiene, isJoiaLookalike, isPetLookalike, isPcCompleto, isPerfume, isTool, refineCategory } from "../lib/categories.ts"
import { shopeeShopBadge } from "../lib/seller.ts"
import type { Connector, OfferRow } from "../types.ts"

const ENDPOINT = "https://open-api.affiliate.shopee.com.br/graphql"
const PER_KEYWORD = 50
/** Collected once a day by their own workflow (engine-nichos.yml), not in every run. */
const DAILY_NICHES = new Set(["perfumes", "livros", "instrumentos", "dermocosmeticos", "ervas-naturais", "joias-relogios", "beleza", "animais", "higiene-cuidados", "bebes", "saude", "placas-de-video"])
const MAX_OFFERS = 4500 // every category (about 3.5k after the quality filter); a low cap stops the last ones empty

/** Best sellers per search term, filed under the site's own category slugs. */
const KEYWORDS: Record<string, string[]> = {
  eletronicos: ["fone bluetooth", "carregador turbo", "smartwatch", "caixa de som bluetooth", "cabo usb c"],
  celulares: ["smartphone", "iphone", "samsung galaxy", "redmi", "xiaomi", "motorola moto", "realme", "google pixel", "capa celular", "pelicula celular", "carregador portatil"],
  informatica: ["mouse sem fio", "teclado", "webcam", "hd externo", "pen drive", "roteador wifi"],
  eletrodomesticos: ["liquidificador", "cafeteira", "aspirador de po", "ferro de passar", "ventilador", "forno eletrico", "batedeira", "chaleira eletrica", "sanduicheira", "panela eletrica"],
  casa: ["air fryer", "organizador casa", "luminaria led", "panela antiaderente", "estante", "sapateira", "rack tv", "escrivaninha", "guarda roupa", "cadeira escritorio"],
  moda: ["camiseta masculina", "mochila", "bolsa feminina", "tenis masculino", "chinelo", "sandalia feminina", "mochila infantil"],
  "placas-de-video": [
    "placa de video", "placa de video gamer", "placa de video nvidia", "placa de video amd", "placa de video rtx 4060",
    "placa de video rtx 4070", "placa de video rtx 3060", "placa de video rtx 3050", "placa de video rtx 5060",
    "placa de video gtx 1650", "placa de video gtx 1660", "placa de video gt 710", "placa de video gt 730",
    "placa de video gt 1030", "placa de video rx 580", "placa de video rx 6600", "placa de video rx 7600",
    "placa de video rx 550", "placa de video rx 570", "placa de video 2gb", "placa de video 4gb", "placa de video 8gb",
    "placa de video 12gb", "placa de video low profile", "placa de video gddr6", "placa de video ddr3",
    "placa de video arc", "placa de video quadro", "placa de video geforce", "placa de video radeon",
  ],
  "higiene-cuidados": [
    "creme dental", "creme dental colgate", "creme dental sensodyne", "escova dental", "escova dental eletrica",
    "enxaguante bucal", "fio dental", "sabonete", "sabonete liquido", "sabonete intimo", "desodorante", "desodorante aerosol",
    "desodorante roll on", "antitranspirante", "absorvente", "absorvente always", "protetor diario", "coletor menstrual",
    "aparelho de barbear", "lamina de barbear", "espuma de barbear", "cera depilatoria", "creme depilatorio",
    "depilador eletrico", "cotonete", "hastes flexiveis",
  ],
  beleza: [
    "creme para pentear", "leave in", "finalizador capilar", "ativador de cachos", "oleo capilar", "oleo de argan",
    "serum capilar", "tonico capilar", "mascara de hidratacao capilar", "shampoo", "condicionador", "shampoo anticaspa",
    "tintura de cabelo", "coloracao", "descolorante", "po descolorante", "agua oxigenada", "progressiva", "alisante",
    "escova de cabelo", "pente", "esmalte", "removedor de esmalte", "acetona", "alicate de unha", "cortador de unha",
    "lixa de unha", "kit manicure",
    "skincare", "secador de cabelo", "pincel de maquiagem", "kit pinceis maquiagem", "pincel para base", "pincel de po",
    "pincel esfumar", "pincel blush", "pincel delineador", "pincel kabuki", "pinceis macrilan", "pincel ricca",
  ],
  animais: [
    "racao para caes", "racao para gatos", "racao para filhotes", "racao premier", "racao golden", "sache para gatos",
    "petisco para caes", "bifinho para caes", "cama para cachorro", "caminha pet", "cama para gatos",
    "casinha para cachorro", "coleira para cachorro", "peitoral para cachorro", "guia para cachorro",
    "arranhador para gatos", "comedouro para cachorro", "bebedouro para gatos", "fonte para gatos",
    "caixa de transporte pet", "roupa para cachorro", "brinquedo para cachorro", "brinquedo para gatos",
    "mordedor para caes", "tapete higienico", "areia higienica para gatos", "escova pet", "antipulgas para caes",
    "antipulgas para gatos", "vermifugo para caes", "vermifugo para gatos", "bravecto", "nexgard", "simparic",
    "shampoo para cachorro", "shampoo para gatos", "suplemento para caes", "vitamina para caes",
  ],
  "joias-relogios": [
    "cordao masculino", "cordao prata masculino", "cordao feminino", "corrente masculina", "corrente feminina",
    "colar feminino", "colar masculino", "anel masculino", "anel feminino", "anel de prata 925", "alianca de compromisso",
    "alianca de namoro", "pulseira masculina", "pulseira feminina", "pulseira de prata 925", "pulseira de couro masculina",
    "bracelete feminino", "bracelete masculino", "kit pulseiras",
  ],
  "pc-completo": [
    "pc gamer completo", "computador completo", "pc gamer", "cpu gamer", "mini pc", "pc home office", "pc gamer ryzen",
    "pc gamer i5", "computador desktop completo", "pc gamer rtx",
  ],
  perfumes: [
    "perfume arabe", "lattafa", "lattafa asad", "lattafa khamrah", "al haramain", "armaf", "afnan", "rasasi",
    "maison alhambra", "perfume masculino", "perfume feminino", "natura perfume", "natura kaiak", "boticario perfume",
    "boticario malbec", "eudora perfume", "avon perfume", "jequiti perfume", "body splash", "colonia masculina",
    "colonia feminina", "kit perfume", "perfume importado", "decant perfume",
  ],
  livros: [
    "manga", "manga one piece", "manga naruto", "manga demon slayer", "manga jujutsu kaisen", "biblia sagrada",
    "biblia nvi", "biblia de estudo", "biblia letra grande", "biblia feminina", "livro", "box livros",
    "livro best seller", "livro autoajuda", "livro infantil", "livro de colorir", "hq", "livro devocional",
  ],
  instrumentos: [
    "violao", "guitarra", "teclado musical", "ukulele", "cavaquinho", "pandeiro", "afinador", "cordas violao", "baqueta",
    "palheta", "pedal guitarra", "caixa amplificada", "flauta doce", "harmonica",
  ],
  dermocosmeticos: [
    "la roche posay", "vichy", "cerave", "bioderma", "eucerin", "isdin", "adcos", "principia", "cetaphil",
    "protetor solar facial", "serum vitamina c", "acido hialuronico", "niacinamida", "agua micelar", "gel de limpeza facial",
    "hidratante facial", "retinol",
  ],
  "ervas-naturais": [
    "cha de camomila", "cha verde", "cha de hibisco", "cha detox", "cha de boldo", "cha de ervas", "ervas medicinais",
    "oleo essencial", "oleo essencial lavanda", "propolis", "curcuma", "moringa", "espirulina", "unha de gato",
  ],
  esporte: ["whey protein", "garrafa termica", "tapete yoga", "vara de pesca", "molinete", "kit pesca", "isca artificial", "anzol", "carretilha"],
  games: ["controle gamer", "headset gamer", "mouse gamer"],
  ferramentas: ["furadeira", "parafusadeira", "jogo de ferramentas", "trena", "alicate", "esmerilhadeira", "multimetro", "jogo de chaves", "maleta de ferramentas", "martelete", "ferro de solda", "serra tico tico", "lixadeira", "chave de impacto", "nivel a laser", "compressor de ar", "jogo de brocas", "estacao de solda"],
  cameras: ["camera ip wifi", "camera de seguranca", "kit cftv", "dvr", "camera externa", "videoporteiro"],
  brinquedos: ["brinquedo infantil", "boneca", "lego", "hot wheels", "quebra cabeca", "massinha de modelar", "pelucia", "patinete infantil", "nerf"],
  "acessorios-veiculos": ["som automotivo", "capa de banco carro", "tapete automotivo", "suporte celular carro", "aspirador automotivo", "camera de re", "carregador veicular"],
  bebes: [
    "fralda", "fralda descartavel", "fralda huggies", "fralda pampers", "fralda geriatrica", "lenco umedecido",
    "mamadeira", "chupeta", "mordedor", "babador", "esterilizador de mamadeira", "bomba tira leite", "shampoo infantil",
    "sabonete infantil", "pomada para assaduras",
  ],
  saude: [
    "termometro digital", "aparelho de pressao", "oximetro", "joelheira", "tornozeleira", "munhequeira", "cotoveleira",
    "cinta lombar", "cinta abdominal", "palmilha ortopedica", "meia de compressao", "curativo", "esparadrapo", "gaze",
    "atadura", "algodao", "kit primeiros socorros", "nebulizador", "glicosimetro",
  ],
}

interface Node {
  itemId: string
  shopId: string
  productName: string
  priceMin: string
  priceDiscountRate?: number | null
  imageUrl?: string | null
  offerLink?: string | null
  ratingStar?: string | null
  sales?: number | null
  shopType?: number[] | null
}

/** Signature = sha256(appId + timestamp + body + secret), sent as the Authorization header. */
async function query<T>(env: NodeJS.ProcessEnv, graphql: string): Promise<T> {
  const appId = env.SHOPEE_APP_ID as string
  const secret = env.SHOPEE_APP_SECRET as string
  const body = JSON.stringify({ query: graphql })
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHash("sha256").update(`${appId}${timestamp}${body}${secret}`).digest("hex")

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`,
    },
    body,
    signal: AbortSignal.timeout(20_000),
  })
  const json = (await response.json()) as { data?: T; errors?: { message: string }[] }
  if (!response.ok || json.errors?.length) {
    throw new Error(`Shopee API ${response.status}: ${json.errors?.map((e) => e.message).join("; ") ?? "sem detalhes"}`)
  }
  return json.data as T
}

export function createShopeeConnector(env: NodeJS.ProcessEnv): Connector {
  return {
    name: "shopee",
    async fetchOffers() {
      if (!env.SHOPEE_APP_ID || !env.SHOPEE_APP_SECRET) {
        throw new Error("Missing SHOPEE_APP_ID / SHOPEE_APP_SECRET")
      }
      const offers = new Map<string, OfferRow>()

      // SHOPEE_ONLY="perfumes,livros" runs just those (the daily workflow); the regular run skips them.
      const wanted = env.SHOPEE_ONLY?.split(",")
      for (const [category, keywords] of Object.entries(KEYWORDS)) {
        if (wanted ? !wanted.includes(category) : DAILY_NICHES.has(category)) continue
        for (const keyword of keywords) {
          if (offers.size >= MAX_OFFERS) break
          // sortType 2 = most sold. Keyword is ours (no user input), so inline is safe.
          const { productOfferV2 } = await query<{ productOfferV2: { nodes: Node[] } }>(
            env,
            `{ productOfferV2(keyword: "${keyword}", sortType: 2, page: 1, limit: ${PER_KEYWORD}) {
              nodes { itemId shopId productName priceMin priceDiscountRate imageUrl offerLink ratingStar sales shopType }
            } }`,
          )
          for (const node of productOfferV2.nodes) {
            const price = Number(node.priceMin)
            // Quality floor: real photo, our affiliate link, sane price, proven seller.
            if (!node.imageUrl || !node.offerLink || !(price >= 5)) continue
            // Complete PCs and graphics cards sell in smaller volumes.
            const floor = category === "pc-completo" ? 5 : category === "placas-de-video" ? 10 : 50
            if (Number(node.ratingStar) < 4.3 || (node.sales ?? 0) < floor) continue
            // A search for "multimetro" also brings cables and meters: the tools shelf keeps only named tools.
            if (category === "ferramentas" && !isTool(node.productName)) continue
            if (category === "perfumes" && !isPerfume(node.productName)) continue
            if (category === "pc-completo" && !isPcCompleto(node.productName)) continue
            if (category === "livros" && !isBook(node.productName)) continue
            if (category === "dermocosmeticos" && !isDermocosmetico(node.productName)) continue
            if (category === "ervas-naturais" && !isErvas(node.productName)) continue
            if (category === "beleza" && isArtBrush(node.productName)) continue
            if (category === "higiene-cuidados" && !isHigiene(node.productName)) continue
            if (category === "placas-de-video" && !isGpu(node.productName)) continue
            if (category === "animais" && isPetLookalike(node.productName)) continue
            if (category === "joias-relogios" && isJoiaLookalike(node.productName)) continue

            const externalId = `${node.shopId}.${node.itemId}`
            if (offers.has(externalId)) continue

            const rate = node.priceDiscountRate ?? 0
            offers.set(externalId, {
              store_id: "shopee",
              external_id: externalId,
              title: node.productName.slice(0, 160),
              image: node.imageUrl,
              category_slug: refineCategory(node.productName, category),
              price,
              // Only a real discount from the store; never invented.
              original_price: rate >= 5 && rate <= 50 ? Math.round((price / (1 - rate / 100)) * 100) / 100 : null,
              url: `https://shopee.com.br/product/${node.shopId}/${node.itemId}`,
              affiliate_url: node.offerLink,
              is_free_shipping: false,
              popularity: node.sales ?? null,
              seller_leader: shopeeShopBadge(node.shopType),
              source: "api",
            })
          }
          console.log(`[shopee] ${category}/${keyword}: ${offers.size} ofertas até agora`)
        }
      }
      return [...offers.values()]
    },
  }
}
