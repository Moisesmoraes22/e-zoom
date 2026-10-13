import { isArtBrush, isBook, isDermocosmetico, isErvas, isHigiene, isJoiaLookalike, isPcCompleto, isPerfume, isTool, refineCategory } from "../lib/categories.ts"
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
  "martelete", "rompedor", "furadeira bosch", "furadeira makita", "parafusadeira dewalt", "serra mármore", "serra sabre",
  "lixadeira orbital", "plaina elétrica", "furadeira de bancada", "jogo de brocas", "disco de corte", "chave de roda",
  "macaco hidráulico", "torquímetro", "grampeador pneumático", "ferro de solda", "estação de solda", "máquina de solda inversora",
  "serrote", "formão", "chave de grifo", "bancada de trabalho", "carrinho de ferramentas", "kit parafusadeira com bateria",
]
/** Thin categories get a catalog search too (best sellers alone give about 60); ML_ONLY=<slug> runs just one. */
const CATEGORY_TERMS: Record<string, string[]> = {
  celulares: [
    "iphone 17", "iphone 17 pro", "iphone 17 pro max", "iphone 17 air", "iphone 16", "iphone 16 pro", "iphone 16 pro max",
    "iphone 16 plus", "iphone 16e", "iphone 15", "iphone 15 pro", "iphone 15 pro max", "iphone 15 plus", "iphone 14",
    "iphone 14 pro", "iphone 14 plus", "iphone 13", "iphone 13 mini", "iphone 12", "iphone 12 pro", "iphone 11",
    "iphone se", "iphone xr", "iphone 8", "apple iphone",
    "samsung galaxy s25", "samsung galaxy s24", "samsung galaxy a55", "samsung galaxy a35", "samsung galaxy a16", "samsung galaxy a06",
    "redmi note 14", "redmi note 13", "redmi 14c", "redmi 13c", "poco x7", "xiaomi smartphone",
    "motorola edge", "moto g85", "moto g55", "moto g35", "moto g15", "motorola moto e",
    "realme c75", "realme 14", "realme smartphone", "google pixel 9", "google pixel 8a", "smartphone",
    "carregador portátil", "capa para celular", "película de vidro",
  ],
  informatica: ["notebook", "ssd", "memória ram", "mouse sem fio", "teclado mecânico", "monitor", "roteador wifi", "webcam", "hd externo", "pen drive", "impressora", "tablet"],
  eletrodomesticos: [
    "air fryer", "liquidificador", "aspirador de pó", "cafeteira", "micro-ondas", "geladeira", "fogão", "lava e seca",
    "robô aspirador", "ferro de passar", "forno elétrico", "batedeira", "processador de alimentos", "sanduicheira",
    "chaleira elétrica", "purificador de água", "máquina de lavar", "ar condicionado", "ventilador de coluna",
    "climatizador", "cooktop", "adega climatizada", "freezer", "panela elétrica", "espremedor", "mixer",
  ],
  cameras: [
    "kit cftv 4 câmeras", "kit cftv 8 câmeras", "kit cftv 16 câmeras", "dvr intelbras", "gravador de vídeo mhdx", "câmera intelbras",
    "câmera ip wifi", "câmera de segurança externa", "câmera speed dome", "nvr", "hd para dvr", "fonte para câmera cftv",
    "cabo coaxial", "balun", "alarme residencial", "central de alarme", "videoporteiro", "câmera de segurança",
    "câmera instantânea", "gopro", "tripé", "ring light", "cartão de memória", "drone",
  ],
  saude: [
    "termômetro digital", "aparelho de pressão", "oxímetro", "massageador", "balança digital", "colchão ortopédico",
    "joelheira", "tornozeleira", "munhequeira", "cotoveleira", "cinta lombar", "cinta abdominal", "palmilha ortopédica",
    "meia de compressão", "curativo", "esparadrapo", "gaze", "atadura", "algodão", "kit primeiros socorros",
    "nebulizador", "inalador", "glicosímetro",
  ],
  // Fishing lives inside "esporte" (as at Mercado Livre).
  esporte: [
    "vara de pesca", "molinete", "carretilha", "linha de pesca", "isca artificial", "kit pesca completo", "anzol",
    "caixa de pesca", "cadeira de pesca", "vara telescópica", "puçá", "colete de pesca", "sonar de pesca",
  ],
  "acessorios-veiculos": [
    "som automotivo", "central multimídia", "bateria automotiva", "tapete automotivo", "capa de banco automotivo",
    "suporte celular carro", "câmera de ré", "aspirador automotivo", "compressor de ar portátil", "carregador veicular",
    "kit lâmpada led farol", "cera automotiva", "película automotiva", "alarme automotivo", "capacete moto",
    "capa para moto", "bagageiro", "limpador de para-brisa", "óleo de motor", "organizador de carro",
  ],
  brinquedos: [
    "boneca", "hot wheels", "lego", "quebra-cabeça", "jogo de tabuleiro", "massinha de modelar", "pelúcia", "nerf",
    "patinete infantil", "bicicleta infantil", "brinquedo educativo", "cozinha infantil", "bloco de montar",
    "boneco de ação", "fantasia infantil", "carrinho de controle remoto", "piscina de bolinhas", "pista de carrinhos",
  ],
  // Complete assembled PCs, the niche the site invests in: gamer, office, mini and all-in-one.
  "pc-completo": [
    "pc gamer completo", "pc gamer", "pc gamer ryzen 5", "pc gamer ryzen 7", "pc gamer intel core i5", "pc gamer i7",
    "pc gamer rtx", "pc gamer rx 580", "pc gamer gtx 1650", "pc gamer completo com monitor", "computador completo",
    "computador completo intel i5", "computador completo intel i3", "computador completo home office", "computador desktop",
    "cpu gamer", "mini pc", "mini pc i5", "all in one pc", "pc workstation", "computador completo ssd monitor teclado mouse",
  ],
  // Perfumes: Arabian houses, the big Brazilian direct-sales brands and the best known designer lines.
  perfumes: [
    "perfume árabe", "lattafa", "lattafa asad", "lattafa khamrah", "lattafa yara", "al haramain", "armaf club de nuit",
    "afnan", "rasasi", "ajmal", "arabian oud", "maison alhambra", "fragrance world", "perfume árabe masculino",
    "perfume árabe feminino", "natura perfume", "natura kaiak", "natura essencial", "natura luna", "natura ekos",
    "o boticário perfume", "boticário malbec", "boticário egeo", "boticário floratta", "boticário lily", "boticário quasar",
    "eudora perfume", "avon perfume", "jequiti perfume", "carolina herrera perfume", "paco rabanne perfume",
    "one million", "invictus", "212 vip", "good girl", "la vie est belle", "dior sauvage", "bleu de chanel",
    "acqua di gio", "perfume masculino", "perfume feminino", "eau de parfum", "body splash", "colônia masculina",
    "colônia feminina", "kit perfume", "perfume importado", "perfume infantil",
  ],
  // Books: manga, Bibles, best sellers and boxes.
  livros: [
    "mangá", "mangá one piece", "mangá naruto", "mangá demon slayer", "mangá jujutsu kaisen", "mangá berserk",
    "mangá attack on titan", "mangá chainsaw man", "mangá boruto", "mangá dragon ball", "mangá vagabond",
    "mangá tokyo ghoul", "mangá my hero academia", "mangá blue lock", "mangá box", "bíblia", "bíblia sagrada",
    "bíblia nvi", "bíblia de estudo", "bíblia letra grande", "bíblia católica", "bíblia king james", "bíblia feminina",
    "bíblia jesus copy", "livro", "box livros", "box harry potter", "livro best seller", "livro autoajuda",
    "livro hábitos atômicos", "livro romance", "livro infantil", "livro de colorir", "livro sobre finanças",
    "livro de receitas", "história em quadrinhos", "hq marvel", "hq dc", "livro devocional",
  ],
  // Musical instruments: the root category's best sellers are few, so the catalog is searched by family too.
  instrumentos: [
    "violão", "violão eletroacústico", "violão giannini", "violão tagima", "guitarra", "guitarra stratocaster", "guitarra tagima",
    "guitarra epiphone", "baixo elétrico", "contrabaixo", "teclado musical", "teclado arranjador", "piano digital",
    "bateria eletrônica", "bateria acústica", "cajón", "ukulele", "cavaquinho", "violino", "flauta doce", "flauta transversal",
    "saxofone", "gaita", "pandeiro", "afinador", "capotraste", "cordas violão", "cordas guitarra", "palheta",
    "amplificador guitarra", "pedal guitarra", "pedaleira", "caixa amplificada", "suporte teclado", "banqueta bateria",
    "baqueta", "trompete", "clarinete", "acordeon", "sanfona", "yamaha", "casio teclado", "cordas contrabaixo",
  ],
  // Dermocosmetics: pharmacy skincare houses, their lines and the actives.
  dermocosmeticos: [
    "la roche-posay", "la roche-posay effaclar", "la roche-posay anthelios", "la roche-posay cicaplast", "la roche-posay toleriane",
    "vichy", "vichy mineral 89", "vichy liftactiv", "cerave", "cerave hidratante", "cerave espuma de limpeza", "bioderma sensibio",
    "bioderma água micelar", "avène", "eucerin", "eucerin protetor solar", "isdin", "isdin fusion water", "svr", "uriage",
    "ducray", "adcos", "adcos protetor solar", "principia", "principia sérum", "cetaphil", "cetaphil loção", "neutrogena hydro boost",
    "protetor solar facial", "protetor solar facial com cor", "sérum vitamina c", "sérum ácido hialurônico", "sérum niacinamida",
    "ácido hialurônico", "retinol", "ácido salicílico", "gel de limpeza facial", "água micelar", "hidratante facial",
    "creme anti-idade", "contorno dos olhos", "sabonete facial", "dermocosmético",
  ],
  // Herbs and natural products: teas, medicinal herbs, essential oils and propolis.
  "ervas-naturais": [
    "chá de camomila", "chá de hibisco", "chá verde", "chá de boldo", "chá de erva cidreira", "chá de hortelã", "chá de gengibre",
    "chá de cavalinha", "chá de espinheira santa", "chá de carqueja", "chá preto", "chá misto", "chá detox", "chá seca barriga",
    "chá de ervas", "ervas medicinais", "erva cidreira", "camomila", "boldo", "hibisco", "cúrcuma", "moringa", "espirulina",
    "unha de gato", "própolis", "própolis verde", "óleo essencial", "óleo essencial de lavanda", "óleo essencial de melaleuca",
    "óleo essencial de eucalipto", "valeriana", "passiflora", "ginkgo biloba", "ginseng", "fitoterápico", "tintura mãe",
    "ervas para chá",
  ],
  // Personal hygiene (a pharmacy shelf): oral care, soap, deodorant, pads, shaving and hair removal.
  "higiene-cuidados": [
    "creme dental", "creme dental colgate", "creme dental sensodyne", "creme dental oral-b", "creme dental close up",
    "creme dental infantil", "escova dental", "escova dental elétrica", "escova de dente infantil", "enxaguante bucal",
    "enxaguante bucal listerine", "enxaguante bucal cepacol", "fio dental", "sabonete", "sabonete líquido",
    "sabonete em barra", "sabonete íntimo", "sabonete dove", "sabonete nivea", "desodorante", "desodorante aerosol",
    "desodorante roll-on", "desodorante rexona", "desodorante dove", "desodorante nivea", "desodorante masculino",
    "desodorante feminino", "antitranspirante", "absorvente", "absorvente always", "absorvente intimus",
    "protetor diário", "coletor menstrual", "aparelho de barbear", "lâmina de barbear gillette", "aparelho de barbear bic",
    "espuma de barbear", "cera depilatória", "creme depilatório veet", "depilador elétrico", "cotonete", "hastes flexíveis",
  ],
  // Baby care (diapers, wipes, bottles, pacifiers), searched by the shelf's best known names.
  bebes: [
    "fralda descartável", "fralda huggies", "fralda pampers", "fralda babysec", "fralda mamypoko", "fralda personal",
    "fralda geriátrica", "fralda geriátrica tena", "fralda noturna", "lenço umedecido", "lenço umedecido huggies",
    "mamadeira", "mamadeira lillo", "mamadeira avent", "chupeta", "chupeta lillo", "chupeta nuk", "mordedor",
    "babador", "prendedor de chupeta", "esterilizador de mamadeira", "bomba tira leite", "shampoo infantil",
    "sabonete infantil", "colônia infantil", "creme para assaduras", "pomada para assaduras",
  ],
  // Pet shop: food, beds, accessories and medicine for dogs and cats.
  animais: [
    "ração para cães", "ração para cães filhotes", "ração para cães adultos", "ração para gatos", "ração para gatos castrados",
    "ração premier", "ração golden", "ração royal canin", "ração pedigree", "ração whiskas", "ração special dog",
    "ração quatree", "ração farmina", "sachê para gatos", "petisco para cães", "bifinho para cães", "osso para cães",
    "cama para cachorro", "caminha pet", "cama para gatos", "casinha para cachorro", "casinha para gatos",
    "coleira para cachorro", "peitoral para cachorro", "guia para cachorro", "arranhador para gatos",
    "comedouro para cachorro", "bebedouro para gatos", "fonte para gatos", "caixa de transporte pet",
    "roupa para cachorro", "brinquedo para cachorro", "brinquedo para gatos", "mordedor para cães", "tapete higiênico",
    "areia higiênica para gatos", "caixa de areia para gatos", "escova para pet", "focinheira",
    "antipulgas para cães", "antipulgas para gatos", "vermífugo para cães", "vermífugo para gatos",
    "antiparasitário para cães", "bravecto", "nexgard", "simparic", "frontline", "shampoo para cachorro",
    "shampoo para gatos", "suplemento para cães", "vitamina para cães", "remédio para cachorro",
  ],
  // Jewellery for men and women: cords, chains, rings, bracelets (watches come from the category's best sellers).
  "joias-relogios": [
    "cordão masculino", "cordão masculino prata", "cordão masculino ouro 18k", "cordão feminino", "corrente masculina",
    "corrente feminina", "corrente de prata 925", "colar feminino", "colar masculino", "pingente masculino",
    "pingente feminino", "anel masculino", "anel feminino", "anel de prata 925", "anel de aço inoxidável",
    "aliança de compromisso", "aliança de namoro", "pulseira masculina", "pulseira feminina", "pulseira de prata 925",
    "pulseira de couro masculina", "pulseira de aço masculina", "bracelete feminino", "bracelete masculino", "kit pulseiras",
  ],
  // Make-up brushes, hair care and manicure (the rest of "beleza" comes from the category's best sellers).
  beleza: [
    "creme para pentear", "leave-in", "finalizador capilar", "ativador de cachos", "óleo capilar", "óleo de argan",
    "sérum capilar", "tônico capilar", "máscara de hidratação capilar", "shampoo", "condicionador", "shampoo anticaspa",
    "shampoo neutrox", "shampoo pantene", "shampoo elseve", "shampoo salon line", "tintura de cabelo", "coloração",
    "tintura wella", "tintura igora", "descolorante", "pó descolorante", "água oxigenada", "progressiva", "alisante",
    "escova de cabelo", "pente", "esmalte", "esmalte colorama", "removedor de esmalte", "acetona", "alicate de unha",
    "cortador de unha", "lixa de unha", "kit manicure",
    "pincel de maquiagem", "kit pincéis de maquiagem", "pincéis de maquiagem profissional", "pincel para base",
    "pincel para pó", "pincel de blush", "pincel de sombra", "pincel esfumar", "pincel delineador", "pincel de contorno",
    "pincel para corretivo", "pincel kabuki", "pincel macrilan", "pincel ricca",
  ],
  casa: [
    "sofá", "guarda-roupa", "cama box", "colchão", "rack para tv", "estante", "mesa de jantar", "poltrona", "cômoda",
    "sapateira", "escrivaninha", "cadeira de escritório", "painel para tv", "mesa de centro", "criado mudo",
    "armário de cozinha", "balcão", "penteadeira", "estante para livros", "prateleira",
  ],
}
/** Many brand searches: collected once a day by their own workflow, not in every 30 minute run. */
const DAILY_NICHES = new Set(["perfumes", "livros", "instrumentos", "dermocosmeticos", "ervas-naturais", "joias-relogios", "beleza", "animais", "higiene-cuidados", "bebes", "saude"])
const PER_TERM = 25 // offers kept per term
const CATEGORY_PER_TERM = 15 // same, for the category terms in the scheduled run (ML_ONLY runs use PER_TERM)
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
  "pc-completo": ["MLB430637"], // PC de Mesa
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
        // Same for fragrances and books: a search for "natura kaiak" also finds shampoo, "livro" finds stands.
        if (categoryIn === "perfumes" && !isPerfume(product.name)) return
        if (categoryIn === "pc-completo" && !isPcCompleto(product.name)) return
        if (categoryIn === "livros" && !isBook(product.name)) return
        if (categoryIn === "dermocosmeticos" && !isDermocosmetico(product.name)) return
        if (categoryIn === "ervas-naturais" && !isErvas(product.name)) return
        // A "pincel" search also finds paint and kitchen brushes; "pulseira" finds smartwatch straps.
        if (categoryIn === "beleza" && isArtBrush(product.name)) return
        if (categoryIn === "higiene-cuidados" && !isHigiene(product.name)) return
        if (categoryIn === "joias-relogios" && isJoiaLookalike(product.name)) return
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

      // ML_ONLY takes one slug or a comma list ("perfumes,livros"). The daily niches are skipped in the
      // regular run: their own daily workflow (engine-nichos.yml) keeps them fresh.
      const wanted = only?.split(",")
      for (const [slug, terms] of Object.entries(CATEGORY_TERMS)) {
        if (!only && DAILY_NICHES.has(slug)) continue
        for (const term of !wanted || wanted.includes(slug) ? terms : []) {
          const before = offers.size
          const perTerm = only ? PER_TERM : CATEGORY_PER_TERM
          for (let page = 0; page < SEARCH_PAGES && offers.size - before < perTerm; page++) {
            const { results = [] } = await get<{ results: { id: string }[] }>(
              `/products/search?status=active&site_id=MLB&limit=${SEARCH_PAGE_SIZE}&offset=${page * SEARCH_PAGE_SIZE}&q=${encodeURIComponent(term)}`,
            ).catch(() => ({ results: [] }))
            const ids = results.map((r) => r.id).filter((id) => !offers.has(id))
            for (let i = 0; i < ids.length && offers.size - before < perTerm; i += 10) {
              await Promise.allSettled(ids.slice(i, i + 10).map((id) => buildOffer(id, slug)))
            }
          }
          console.log(`[mercadolivre] ${slug}/${term}: ${offers.size} ofertas até agora`)
        }
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
