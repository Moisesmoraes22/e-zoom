import { Armchair, Dumbbell, Gamepad2, Headphones, Laptop, Monitor, Smartphone, Watch, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import { byRelevance } from "@/lib/deals"
import { cardImage } from "@/lib/image-url"
import { filterProducts, EMPTY_FILTERS } from "@/lib/search"
import type { Product } from "@/lib/types"

/** One shortcut: a whole category, or a search term (matched against titles). */
interface Interest {
  label: string
  /** Shown when no offer is clearly this thing, so a wrong photo never stands in for it. */
  icon: LucideIcon
  category?: string
  query?: string
  /** Words that, near the start of a title, say the offer IS this thing (not an accessory for it). */
  lead?: string[]
  /** Titles with these words are accessories or look-alikes, never the picture. */
  not?: RegExp
}

const INTERESTS: Interest[] = [
  { label: "Games e consoles", icon: Gamepad2, category: "games", lead: ["playstation", "xbox", "nintendo", "console", "controle", "joystick", "gamepad", "ps5", "ps4", "switch"] },
  { label: "Monitores", icon: Monitor, query: "monitor", lead: ["monitor"] },
  { label: "Notebooks", icon: Laptop, query: "notebook", lead: ["notebook"] },
  { label: "Celulares", icon: Smartphone, query: "celular", lead: ["celular", "smartphone", "iphone", "galaxy", "redmi", "xiaomi", "motorola"], not: /watch|relogio|band|pulseira|fit |capa|pelicula|suporte|carregador|cabo|case/ },
  { label: "Fones de ouvido", icon: Headphones, query: "fone", lead: ["fone", "headset", "headphone", "earphone", "airpods"] },
  { label: "Cadeiras e home office", icon: Armchair, query: "cadeira", lead: ["cadeira", "poltrona"] },
  { label: "Relógios", icon: Watch, query: "relogio", lead: ["relogio", "smartwatch"] },
  { label: "Fitness e treino", icon: Dumbbell, category: "esporte", lead: ["halter", "esteira", "anilha", "kettlebell", "colchonete", "elastico", "supino", "barra", "corda", "luva", "tapete"], not: /bicicleta|bike|aro |bola|raquete|pesca/ },
]
/** A shortcut that opens a near-empty list looks broken, so it is left out. */
const MIN_RESULTS = 8

const plain = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
const TOY = /infantil|brinquedo|crianca|kids|miniatura/
/** The offer IS the thing when one of its first two words starts with a lead word, and it is not a toy version. */
const startsAs = (title: string, lead: string[], not?: RegExp) => {
  const text = plain(title)
  if (TOY.test(text) || not?.test(text)) return false
  return text.split(/\s+/).slice(0, 2).some((w) => lead.some((word) => w.startsWith(word)))
}

/** The best-ranked offer that really is the thing (any one when no lead words apply); never the same photo twice. */
function pickImage(ranked: Product[], interest: Interest, used: Set<string>) {
  const fresh = ranked.filter((p) => p.image && !used.has(p.image))
  const { lead, not } = interest
  const pick = lead ? fresh.find((p) => startsAs(p.title, lead, not)) : fresh[0]
  if (pick) used.add(pick.image)
  return pick?.image
}

/**
 * Browse by intent ("what am I looking for?"). Counts are real, empty shortcuts disappear, and
 * each card shows the photo of the best-ranked offer it leads to (a real product, never stock art).
 */
export function InterestsSection({ products }: { products: Product[] }) {
  const usedImages = new Set<string>()
  const shortcuts = INTERESTS.map((interest) => {
    const matches = filterProducts(products, {
      ...EMPTY_FILTERS,
      category: interest.category,
      query: interest.query,
    })
    return {
      ...interest,
      href: interest.category
        ? `/categoria/${interest.category}`
        : `/busca?q=${encodeURIComponent(interest.query!)}`,
      count: matches.length,
      image: pickImage(byRelevance(matches), interest, usedImages),
    }
  }).filter((s) => s.count >= MIN_RESULTS)
  if (shortcuts.length < 4) return null

  return (
    <section className="page-container section-y">
      <SectionHeader
        title="Encontre ofertas para o que você procura"
        href="/busca"
        linkLabel="Pesquisar ofertas"
      />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map(({ label, href, count, image, icon: Icon }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex h-28 overflow-hidden rounded-xl border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex w-32 shrink-0 items-center justify-center bg-muted">
                {!image && <Icon className="h-10 w-10 text-muted-foreground/60" aria-hidden />}
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cardImage(image)}
                    alt=""
                    width={96}
                    height={96}
                    loading="lazy"
                    decoding="async"
                    className="h-24 w-24 object-contain mix-blend-multiply transition-transform duration-300 motion-safe:group-hover:scale-105 dark:mix-blend-normal"
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4">
                <span className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-brand">
                  {label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {count} {count === 1 ? "oferta" : "ofertas"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
