"use client"

import { Compass, X } from "lucide-react"
import { useMemo } from "react"

import { ProductCarousel } from "@/components/product-carousel"
import { buildProfile, clearInterests, recommend } from "@/lib/interest-profile"
import { useInterestsRaw } from "@/lib/use-interests"
import type { Product } from "@/lib/types"

/**
 * "Recomendado para você": built in the browser from what this person searched, opened,
 * clicked and favourited on this device. Hidden until there is enough of it, and nothing
 * about it is sent to the server.
 */
export function RecommendedSection({ pool }: { pool: Product[] }) {
  const raw = useInterestsRaw()
  const picks = useMemo(() => recommend(pool, buildProfile(raw)), [pool, raw])

  if (picks.length < 3) return null
  return (
    <section className="page-container section-y" aria-labelledby="recomendado-titulo">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-brand">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <h2 id="recomendado-titulo" className="text-2xl font-bold text-foreground sm:text-3xl">
              Recomendado para você
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Com base no que você buscou e viu neste aparelho. Isso fica só no seu navegador.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearInterests}
          className="flex min-h-9 shrink-0 items-center gap-1.5 self-start rounded-full border border-border px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Limpar meus interesses
        </button>
      </div>
      <ProductCarousel items={picks.map(({ product, reason }) => ({ product, label: reason }))} />
    </section>
  )
}
