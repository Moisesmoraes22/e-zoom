import { ArrowRight } from "lucide-react"
import Link from "next/link"

import type { Product } from "@/lib/types"

/**
 * "Quanto quer gastar?": each tile is a limit (cumulative: up to R$ 100 includes up to R$ 50), shows
 * how many offers really fit it and opens the search already filtered. A limit with no offers is hidden.
 */
const LIMITS = [
  { top: "Até", value: "R$ 50", preco: "0-50", max: 50 },
  { top: "Até", value: "R$ 100", preco: "0-50,50-100", max: 100 },
  { top: "Até", value: "R$ 300", preco: "0-50,50-100,100-300", max: 300 },
  { top: "Até", value: "R$ 1.000", preco: "0-50,50-100,100-300,300-1000", max: 1000 },
  { top: "Acima de", value: "R$ 1.000", preco: "1000+", min: 1000 },
] as const

export function PriceChips({ products }: { products: Pick<Product, "price">[] }) {
  const tiles = LIMITS.map((limit) => ({
    ...limit,
    count: products.filter((p) =>
      "max" in limit ? p.price <= limit.max : p.price > limit.min,
    ).length,
  })).filter((tile) => tile.count > 0)
  if (tiles.length < 2) return null

  return (
    <section className="bg-white py-10 text-slate-900 dark:bg-card dark:text-foreground sm:py-12" aria-labelledby="gastar">
      <div className="page-container flex flex-col items-center gap-6 text-center">
        <div>
          <h2 id="gastar" className="text-2xl font-extrabold sm:text-3xl">
            Quanto quer gastar?
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-muted-foreground">
            Escolha um limite e veja só as ofertas que cabem no seu bolso.
          </p>
        </div>
        <ul className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((tile) => (
            <li key={tile.preco} className="last:odd:col-span-2 sm:last:odd:col-span-1">
              <Link
                href={`/busca?preco=${tile.preco}`}
                className="group flex h-full min-h-[104px] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 border-hero/25 bg-white px-3 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-hero hover:bg-hero hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] dark:border-primary/30 dark:bg-transparent dark:hover:border-primary dark:hover:bg-primary"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 group-hover:text-white/80 dark:text-muted-foreground">
                  {tile.top}
                </span>
                <span className="text-2xl font-extrabold tabular-nums text-hero group-hover:text-white dark:text-brand">
                  {tile.value}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-600 group-hover:text-white/90 dark:text-muted-foreground">
                  {tile.count.toLocaleString("pt-BR")} {tile.count === 1 ? "oferta" : "ofertas"}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
