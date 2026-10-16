"use client"

import { useMemo } from "react"

import { ProductCarousel } from "@/components/product-carousel"
import { forgetViewedOffers, recentlyViewedIds } from "@/lib/interest-profile"
import { Shelf } from "@/lib/shelf"
import { useCards } from "@/lib/use-cards"
import { useInterestsRaw } from "@/lib/use-interests"
import type { Product } from "@/lib/types"

/**
 * "Vistos recentemente": the offers this browser opened or clicked, newest first, to go back to them.
 * The list lives only in this browser; ended offers simply do not come back from /api/cards.
 * `excludeId` leaves out the offer of the page being shown.
 */
export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const raw = useInterestsRaw()
  const ids = useMemo(
    () => recentlyViewedIds(raw, 13).filter((id) => id !== excludeId).slice(0, 12),
    [raw, excludeId],
  )
  const { cards } = useCards(ids, [])
  const items = ids.map((id) => cards.get(id)).filter((p): p is Product => !!p)
  if (items.length < 2) return null

  return (
    <Shelf name="vistos">
      <section className="page-container section-y" aria-labelledby="vistos-titulo">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div>
            <h2 id="vistos-titulo" className="text-2xl font-bold text-foreground sm:text-3xl">
              Vistos recentemente
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Ofertas que você abriu neste aparelho.</p>
          </div>
          <button
            type="button"
            onClick={forgetViewedOffers}
            className="flex min-h-9 shrink-0 items-center rounded-full border border-border px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar histórico
          </button>
        </div>
        <ProductCarousel ariaLabel="Vistos recentemente" items={items.map((product) => ({ product }))} />
      </section>
    </Shelf>
  )
}
