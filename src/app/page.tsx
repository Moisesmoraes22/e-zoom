import type { Metadata } from "next"
import { Fragment } from "react"

import { CategoryGrid } from "@/components/category-grid"
import { CouponsSection } from "@/components/coupons-section"
import { DayCountdown } from "@/components/day-countdown"
import { FeaturedOffers } from "@/components/featured-offers"
import { HomeHero } from "@/components/home-hero"
import { HowToBuy } from "@/components/how-to-buy"
import { ForYouSection } from "@/components/for-you-section"
import { InterestsSection } from "@/components/interests-section"
import { LazyWelcome } from "@/components/lazy-welcome"
import { PriceChips } from "@/components/price-chips"
import { ProductRow } from "@/components/product-row"
import { SiteFooter } from "@/components/site-footer"
import { StoreStrip } from "@/components/store-strip"
import { StoresSection } from "@/components/stores-section"
import { getCoupons } from "@/lib/coupons"
import { darkPhotos } from "@/lib/photo-check"
import { byClicks, byFeatured, byRelevance, categoryCounts, countByStoreId } from "@/lib/deals"
import { getCatalog } from "@/lib/offers"
import { serializeJsonLd, siteJsonLd } from "@/lib/structured-data"
import type { Product } from "@/lib/types"

export const revalidate = 1800

export const metadata: Metadata = { alternates: { canonical: "/" } }

const FEATURED = 6 // 4 show up to 1535px, 5 from 1536px, 6 from 1800px (see FeaturedOffers)
const SHELF = 6
const ROW_SIZE = 12
/** A shelf this short looks abandoned: it shows from this many offers on, else not at all. */
const SHELF_MIN = 3
const DROP_WINDOW_H = 48

const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
const TOOL_KIT = /furadeira|parafusadeira|esmerilhadeira|serra|martelete|lixadeira|kit|maleta|jogo de/
const NOT_TOY = /cesto|organizador|caixa organizadora|armario|prateleira|nicho/
/** A phone names itself first ("Smartphone Motorola...", "Galaxy A55..."): a word further on is just a mention. */
const startsWithPhone = (title: string) => PHONE.test(plain(title).split(/\s+/).slice(0, 3).join(" "))
/** Words of a real phone, and of everything that is only for a phone (cases, chargers, films...). */
const PHONE = /smartphone|celular|iphone|galaxy|redmi|xiaomi|poco|moto g|moto e|motorola|edge|realme|pixel|tecno|oppo|infinix|honor|nokia|zte/
const PHONE_ACCESSORY = /capa|case|capinha|pelicula|carregador|cabo|suporte|fone|fonte|adaptador|bateria|pulseira|protetor|lente|anel|cordao|tripe|gimbal|kit|fita|vidro|hidrogel|dock|hub|usb|otg|pop ?socket|tablet|tab|smartwatch|relogio|teleprompter|microfone|ring light|estabilizador|gatilho|cooler|controle|selfie|bastao/
/** Brand of a phone title, for the mixed shelf (null when it is none of the brands we highlight). */
const PHONE_BRANDS: [string, RegExp][] = [
  ["samsung", /samsung|galaxy/],
  ["iphone", /iphone|apple/],
  ["redmi", /redmi|xiaomi|poco/],
  ["motorola", /motorola|moto /],
  ["realme", /realme/],
  ["google", /pixel|google/],
]
const phoneBrand = (title: string) => {
  const t = plain(title)
  return PHONE_BRANDS.find(([, re]) => re.test(t))?.[0] ?? "outros"
}
const isKidsDay = (now: Date) => now.getMonth() === 9 && now.getDate() <= 13

interface Shelf {
  slug: string
  title: string
  linkLabel: string
  chips: { label: string; q: string }[]
  /** Titles matching this come first (the higher-ticket kind of the category). */
  first?: RegExp
  /** Titles matching this are never shown on the shelf. */
  not?: RegExp
  /** Only titles for which this is true are shown (a shelf of one kind of product inside a mixed category). */
  only?: (title: string) => boolean
  /** Interleaves the shelf by this key (one of each in turn), so no single brand fills it. */
  mixBy?: (title: string) => string
}

/**
 * The shelves, in the order of what people buy most online (electronics, fashion, food and drink,
 * DIY and tools, furniture, media, beauty, toys). Only categories the site really has appear, and
 * each one only when it has offers. Cellphones and supplements follow, as asked.
 */
const SHELVES: Shelf[] = [
  {
    slug: "eletronicos",
    title: "Eletrônicos",
    linkLabel: "Ver todos os eletrônicos",
    chips: [
      { label: "Fone de ouvido", q: "fone" },
      { label: "Smart TV", q: "smart tv" },
      { label: "Caixa de som", q: "caixa de som" },
      { label: "Carregador", q: "carregador" },
    ],
  },
  {
    slug: "pc-completo",
    title: "PC completo montado",
    linkLabel: "Ver todos os PCs",
    chips: [
      { label: "PC Gamer", q: "pc gamer" },
      { label: "Intel Core i5", q: "pc intel core i5" },
      { label: "Ryzen", q: "pc ryzen" },
      { label: "Home office", q: "computador completo" },
      { label: "Mini PC", q: "mini pc" },
    ],
  },
  {
    slug: "moda",
    title: "Moda e vestuário",
    linkLabel: "Ver toda a moda",
    chips: [
      { label: "Tênis", q: "tenis" },
      { label: "Camiseta", q: "camiseta" },
      { label: "Mochila", q: "mochila" },
      { label: "Jaqueta", q: "jaqueta" },
    ],
  },
  {
    slug: "alimentos-bebidas",
    title: "Alimentos e bebidas",
    linkLabel: "Ver alimentos e bebidas",
    chips: [
      { label: "Café", q: "cafe" },
      { label: "Chocolate", q: "chocolate" },
      { label: "Azeite", q: "azeite" },
    ],
  },
  {
    slug: "ferramentas",
    title: "Ferramentas",
    linkLabel: "Ver todas as ferramentas",
    first: TOOL_KIT,
    chips: [
      { label: "Furadeira", q: "furadeira" },
      { label: "Parafusadeira", q: "parafusadeira" },
      { label: "Kit de ferramentas", q: "kit ferramentas" },
      { label: "Esmerilhadeira", q: "esmerilhadeira" },
    ],
  },
  {
    slug: "casa",
    title: "Casa, móveis e decoração",
    linkLabel: "Ver tudo para a casa",
    chips: [
      { label: "Sofá", q: "sofa" },
      { label: "Cadeira", q: "cadeira" },
      { label: "Colchão", q: "colchao" },
      { label: "Mesa", q: "mesa" },
    ],
  },
  {
    slug: "livros",
    title: "Livros",
    linkLabel: "Ver todos os livros",
    chips: [],
  },
  {
    slug: "beleza",
    title: "Beleza e cuidados pessoais",
    linkLabel: "Ver toda a beleza",
    chips: [
      { label: "Perfume", q: "perfume" },
      { label: "Shampoo", q: "shampoo" },
      { label: "Maquiagem", q: "maquiagem" },
      { label: "Barbeador", q: "barbeador" },
    ],
  },
  {
    slug: "brinquedos",
    title: "Brinquedos e hobbies",
    linkLabel: "Ver todos os brinquedos",
    not: NOT_TOY,
    chips: [
      { label: "Bonecas", q: "boneca" },
      { label: "Lego", q: "lego" },
      { label: "Hot Wheels", q: "hot wheels" },
      { label: "Quebra-cabeça", q: "quebra-cabeca" },
    ],
  },
  {
    slug: "celulares",
    title: "Celulares",
    linkLabel: "Ver todos os celulares",
    // The category also holds cases, chargers and films: the shelf is for the phones themselves.
    only: startsWithPhone,
    mixBy: phoneBrand,
    not: PHONE_ACCESSORY,
    chips: [
      { label: "Samsung", q: "samsung" },
      { label: "iPhone", q: "iphone" },
      { label: "Redmi", q: "redmi" },
      { label: "Motorola", q: "motorola" },
      { label: "Realme", q: "realme" },
      { label: "Google Pixel", q: "google pixel" },
    ],
  },
  {
    slug: "suplementos",
    title: "Suplementos",
    linkLabel: "Ver todos os suplementos",
    chips: [
      { label: "Whey protein", q: "whey" },
      { label: "Creatina", q: "creatina" },
      { label: "Pré-treino", q: "pre treino" },
      { label: "Vitaminas", q: "vitamina" },
    ],
  },
]

/** Children's Day (1 to 13 October): the toys shelf takes this name and chips, then goes back by itself. */
const KIDS_SHELF = {
  title: "Dia das Crianças",
  chips: [
    { label: "Bonecas", q: "boneca" },
    { label: "Lego", q: "lego" },
    { label: "Hot Wheels", q: "hot wheels" },
    { label: "Quebra-cabeça", q: "quebra-cabeca" },
    { label: "Pelúcias", q: "pelucia" },
  ],
}

/** The categories highlighted at the top, in the same order as the shelves. */
const HIGHLIGHT = ["eletronicos", "pc-completo", "moda", "alimentos-bebidas", "ferramentas", "casa", "livros", "beleza", "brinquedos"]

/**
 * Four offers for the main shelf: the best-ranked among those with a recorded discount or a price
 * seen today, one per store first so no store takes the whole shelf, then the rest by rank.
 */
function pickFeatured(products: Product[]): Product[] {
  const ranked = byFeatured(products)
  const picked: Product[] = []
  const stores = new Set<string>()
  for (const p of ranked) {
    if (picked.length === FEATURED) break
    if (stores.has(p.store)) continue
    stores.add(p.store)
    picked.push(p)
  }
  for (const p of ranked) {
    if (picked.length === FEATURED) break
    if (!picked.includes(p)) picked.push(p)
  }
  return picked
}

/** Real price drops (recorded) seen in the last two days, biggest drop first. */
// The page is server-rendered and revalidated; the clock is read here, outside the component body.
const clockNow = () => Date.now()

function pickDrops(products: Product[], skip: Set<string>, now = Date.now(), windowH = DROP_WINDOW_H): Product[] {
  const drop = (p: Product) => (p.priceHistory ? 1 - p.price / p.priceHistory.at(-2)! : 0)
  // Biggest drop first, but a cut beyond 50% counts the same (huge ones are often bad data) and what
  // buyers have rated well breaks the tie. There is no photo-quality signal in the data, so reviews
  // are the proxy: catalogue items with ratings tend to have proper photos.
  const score = (p: Product) => {
    const proof = p.rating && p.reviewsCount ? (Math.min(p.reviewsCount, 200) / 200) * (p.rating >= 4.3 ? 1 : 0.4) : 0
    return Math.min(drop(p), 0.5) + 0.25 * proof
  }
  const ranked = products
    .filter((p) => !skip.has(p.id) && p.isPriceDrop && p.dropAt && now - Date.parse(p.dropAt) < windowH * 3_600_000)
    .sort((a, b) => score(b) - score(a))
  // The first row shows one offer per store (best of each) before repeating a store.
  const seen = new Set<string>()
  const lead = ranked.filter((p) => !seen.has(p.store) && seen.add(p.store))
  return [...lead, ...ranked.filter((p) => !lead.includes(p))].slice(0, SHELF)
}

/** A category's best offers (stores mixed), skipping what is already on a shelf. */
function pickShelf(products: Product[], shelf: Shelf, skip: Set<string>): Product[] {
  const ranked = byRelevance(
    products.filter(
      (p) =>
        p.category === shelf.slug &&
        !skip.has(p.id) &&
        !(shelf.not && shelf.not.test(plain(p.title))) &&
        (!shelf.only || shelf.only(p.title)),
    ),
  )
  const { first, mixBy } = shelf
  if (first) ranked.sort((a, b) => Number(first.test(plain(b.title))) - Number(first.test(plain(a.title))))
  if (mixBy) {
    // Round-robin over the brands, each brand's best first; brands appear in order of their best offer.
    const groups = new Map<string, Product[]>()
    for (const p of ranked) groups.set(mixBy(p.title), [...(groups.get(mixBy(p.title)) ?? []), p])
    const lists = [...groups.values()]
    const mixed: Product[] = []
    for (let i = 0; mixed.length < ROW_SIZE && lists.some((l) => i < l.length); i++) {
      for (const l of lists) if (i < l.length && mixed.length < ROW_SIZE) mixed.push(l[i])
    }
    return mixed
  }
  return ranked.slice(0, ROW_SIZE)
}

/**
 * Takes out of the home shelves the offers whose photo is mostly black (it reads as a hole on the
 * white card). They stay in search and categories. Checks what the shelves would pick; when one is
 * taken out, the next in line is checked in another round (a few rounds at most).
 */
async function withoutDarkPhotos(products: Product[], now: number, sinceMidnightH: number): Promise<Product[]> {
  let pool = products
  const dark = new Set<string>()
  for (let round = 0; round < 3; round++) {
    const picks = [
      ...pickFeatured(pool),
      ...pickDrops(pool, new Set(), now, sinceMidnightH),
      ...pickDrops(pool, new Set(), now),
    ]
    const found = [...(await darkPhotos(picks.map((p) => p.image)))].filter((url) => !dark.has(url))
    if (found.length === 0) break
    found.forEach((url) => dark.add(url))
    pool = pool.filter((p) => !dark.has(p.image))
  }
  return pool
}

export default async function Home() {
  const { products: catalogue, live } = await getCatalog()
  // "Ofertas do dia": prices that fell since midnight in Brasília, so the list really renews at midnight.
  // With too few of them (early in the day) the shelf falls back to the last 48 hours, without a clock.
  const now = clockNow()
  const sinceMidnightH = ((now - 3 * 3_600_000) % 86_400_000) / 3_600_000
  const products = live ? await withoutDarkPhotos(catalogue, now, sinceMidnightH) : catalogue
  const featured = live ? pickFeatured(products) : []
  const shown = new Set(featured.map((p) => p.id))
  const today = live ? pickDrops(products, shown, now, sinceMidnightH) : []
  const isToday = today.length >= SHELF_MIN
  const drops = isToday ? today : live ? pickDrops(products, shown, now) : []
  drops.forEach((p) => shown.add(p.id))
  // Only what visitors really opened (3+ clicks); with little traffic the shelf simply does not appear.
  const popular = live ? byClicks(products.filter((p) => !shown.has(p.id))).slice(0, SHELF) : []
  popular.forEach((p) => shown.add(p.id))

  const kidsSeason = isKidsDay(new Date())
  const rows = live
    ? SHELVES.map((shelf) => {
        const items = pickShelf(products, shelf, shown)
        items.forEach((p) => shown.add(p.id))
        const seasonal = kidsSeason && shelf.slug === "brinquedos"
        return {
          ...shelf,
          title: seasonal ? KIDS_SHELF.title : shelf.title,
          chips: seasonal ? KIDS_SHELF.chips : shelf.chips,
          items,
        }
      }).filter((row) => row.items.length >= SHELF_MIN)
    : []

  // The price band sits after the PC shelf (which follows Electronics) so the PCs come right after
  // Electronics; without that shelf it goes after Electronics.
  const priceBandAfter = rows.some((row) => row.slug === "pc-completo") ? "pc-completo" : "eletronicos"
  // The welcome questions offer the categories that really have offers (most offers first).
  const welcomeCategories = categoryCounts(products).slice(0, 18).map((c) => ({ slug: c.slug, name: c.name }))
  const highlighted = categoryCounts(products, true)
    .filter((c) => HIGHLIGHT.includes(c.slug))
    .sort((a, b) => HIGHLIGHT.indexOf(a.slug) - HIGHLIGHT.indexOf(b.slug))
  // Coupons ending within 24 h come first and, when there are any, name the shelf for it: the
  // deadline is the coupon's own end date, so the urgency is real.
  const allCoupons = await getCoupons(30)
  const endsSoon = allCoupons
    .filter((c) => c.expires_at && Date.parse(c.expires_at) - now > 0 && Date.parse(c.expires_at) - now < 24 * 3_600_000)
    .sort((a, b) => Date.parse(a.expires_at!) - Date.parse(b.expires_at!))
  const coupons = (endsSoon.length > 0 ? endsSoon : allCoupons).slice(0, 3)
  const storeCounts = countByStoreId(products)

  return (
    <main id="conteudo" className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br")) }}
      />
      <HomeHero />
      <StoreStrip counts={storeCounts} />
      <FeaturedOffers offers={featured} />
      <ForYouSection />
      <StoresSection counts={storeCounts} />
      {drops.length >= SHELF_MIN && (
        <FeaturedOffers
          offers={drops}
          id="baixou"
          title={isToday ? "Ofertas do dia" : "Baixou de preço"}
          note={
            isToday
              ? "Preços que caíram hoje, da maior queda para a menor. A lista renova à meia-noite (horário de Brasília)."
              : "Quedas que registramos nas últimas 48 horas, da maior para a menor."
          }
          aside={isToday ? <DayCountdown /> : undefined}
          href="/busca?ordenacao=desconto"
          linkLabel="Ver ofertas com desconto"
        />
      )}
      {popular.length >= SHELF_MIN && (
        <FeaturedOffers
          offers={popular}
          id="mais-clicadas"
          title="Mais clicadas"
          note="As ofertas mais abertas pelos visitantes do E-Zooom nos últimos dias."
          href="/busca?ordenacao=relevancia"
          linkLabel="Ver todas as ofertas"
        />
      )}
      {highlighted.length >= 4 && (
        <CategoryGrid categories={highlighted} showCounts={live} title="Categorias em destaque" />
      )}
      {/* After the PC shelf (which follows Electronics); without it after Electronics; without both, first. */}
      {!rows.some((row) => row.slug === priceBandAfter) && <PriceChips products={products} />}
      {rows.map((row) => (
        <Fragment key={row.slug}>
          <ProductRow
            title={row.title}
            products={row.items}
            href={`/categoria/${row.slug}`}
            linkLabel={row.linkLabel}
            chips={row.chips.length === 0 ? undefined : row.chips.map((c) => ({ label: c.label, href: `/busca?q=${encodeURIComponent(c.q)}` }))}
          />
          {row.slug === priceBandAfter && <PriceChips products={products} />}
        </Fragment>
      ))}
      <InterestsSection products={products} />
      <CouponsSection coupons={coupons} endingSoon={endsSoon.length > 0} />
      <HowToBuy />
      <SiteFooter />
      <LazyWelcome categories={welcomeCategories} />
    </main>
  )
}
