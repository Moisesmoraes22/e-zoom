import { ArrowRight, Store } from "lucide-react"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import { STORES } from "@/lib/mock-data"

const ORDER = ["mercado_livre", "amazon", "shopee"] as const

/**
 * One card per store that has offers right now (counts are real). A store with
 * no offers, like Shopee while its affiliate links are not set up, is not listed.
 */
export function StoresSection({ counts }: { counts: Record<string, number> }) {
  const stores = ORDER.filter((id) => counts[id] > 0)
  if (stores.length === 0) return null

  return (
    <section className="page-container section-y">
      <SectionHeader
        icon={<Store className="h-5 w-5" />}
        title="Lojas parceiras"
        subtitle="Veja as ofertas de cada loja."
        href="/busca"
        linkLabel="Ver todas as ofertas"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((id) => (
          <li key={id}>
            <Link
              href={`/busca?loja=${id}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: STORES[id].color }}
              />
              <span className="flex flex-1 flex-col">
                <span className="text-lg font-semibold text-foreground">
                  {STORES[id].name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {counts[id]} {counts[id] === 1 ? "oferta" : "ofertas"}
                </span>
              </span>
              <ArrowRight
                className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
