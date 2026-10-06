import { ArrowRight, Armchair, Dumbbell, Gamepad2, Headphones, Laptop, Monitor, Smartphone, Target, Watch, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import { filterProducts, EMPTY_FILTERS } from "@/lib/search"
import type { Product } from "@/lib/types"

/** One shortcut: a whole category, or a search term (matched against titles). */
interface Interest {
  label: string
  icon: LucideIcon
  category?: string
  query?: string
  /** Classes for the circle behind the icon: a colour that suits the product. */
  tone: string
}

const INTERESTS: Interest[] = [
  { label: "Games e consoles", icon: Gamepad2, category: "games", tone: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { label: "Monitores", icon: Monitor, query: "monitor", tone: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  { label: "Notebooks", icon: Laptop, query: "notebook", tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  { label: "Celulares", icon: Smartphone, query: "celular", tone: "bg-teal-500/15 text-teal-600 dark:text-teal-400" },
  { label: "Fones de ouvido", icon: Headphones, query: "fone", tone: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  { label: "Cadeiras e home office", icon: Armchair, query: "cadeira", tone: "bg-amber-500/20 text-amber-600 dark:text-amber-400" },
  { label: "Relógios", icon: Watch, query: "relogio", tone: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
  { label: "Fitness e treino", icon: Dumbbell, category: "esporte", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
]
/** A shortcut that opens a near-empty list looks broken, so it is left out. */
const MIN_RESULTS = 8

/** Browse by intent ("what am I looking for?"): counts are real, empty shortcuts disappear. */
export function InterestsSection({ products }: { products: Product[] }) {
  const shortcuts = INTERESTS.map((interest) => ({
    ...interest,
    href: interest.category
      ? `/categoria/${interest.category}`
      : `/busca?q=${encodeURIComponent(interest.query!)}`,
    count: filterProducts(products, {
      ...EMPTY_FILTERS,
      category: interest.category,
      query: interest.query,
    }).length,
  })).filter((s) => s.count >= MIN_RESULTS)
  if (shortcuts.length < 4) return null

  return (
    <section className="page-container section-y">
      <SectionHeader
        icon={<Target className="h-5 w-5" />}
        title="Encontre ofertas para o que você procura"
        subtitle="Atalhos para os produtos que mais buscam."
        href="/busca"
        linkLabel="Pesquisar ofertas"
      />
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shortcuts.map(({ label, icon: Icon, href, count, tone }) => (
          <li key={label}>
            <Link
              href={href}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${tone}`} aria-hidden>
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold text-foreground">{label}</span>
              <span className="flex items-center justify-between text-sm text-muted-foreground">
                {count} {count === 1 ? "oferta" : "ofertas"}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                  aria-hidden
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
