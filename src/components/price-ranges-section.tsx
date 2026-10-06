import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import { countByPriceRange } from "@/lib/search"
import type { Product } from "@/lib/types"

/**
 * "Tenho R$ 100, o que dá para comprar?" One card per price bucket that has
 * offers (real counts); the card opens the search already filtered to it.
 */
export function PriceRangesSection({ products }: { products: Product[] }) {
  const ranges = countByPriceRange(products).filter((range) => range.count > 0)
  if (ranges.length < 2) return null

  return (
    <section className="page-container section-y">
      <SectionHeader
        title="Compre por faixa de preço"
        href="/busca?ordenacao=preco"
        linkLabel="Ver do menor preço"
      />
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {ranges.map((range) => (
          <li key={range.value}>
            <Link
              href={`/busca?preco=${range.value}`}
              className="group flex h-full flex-col gap-1 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="text-base font-semibold text-foreground">{range.label}</span>
              <span className="flex items-center justify-between text-sm text-muted-foreground">
                {range.count} {range.count === 1 ? "oferta" : "ofertas"}
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
