"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { ProductCarousel } from "@/components/product-carousel"
import { CATEGORIES } from "@/lib/mock-data"
import { pickedCategories, WELCOME_OPEN } from "@/lib/interest-profile"
import { Shelf } from "@/lib/shelf"
import { useBudget, useInterestsRaw } from "@/lib/use-interests"
import type { Product } from "@/lib/types"

/**
 * "Escolhidas para você": filled from the categories (and budget) the visitor chose in the welcome
 * questions. Nothing shows until they answered; the choices stay in this browser.
 */
export function ForYouSection() {
  const raw = useInterestsRaw()
  const budget = useBudget()
  const picks = useMemo(() => [...new Set(pickedCategories(raw))].sort(), [raw])
  const query = `cats=${picks.join(",")}${budget ? `&ate=${budget}` : ""}`
  const [loaded, setLoaded] = useState<{ query: string; items: Product[] } | null>(null)

  useEffect(() => {
    if (picks.length === 0) return
    const controller = new AbortController()
    fetch(`/api/para-voce?${query}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((items: Product[]) => setLoaded({ query, items }))
      .catch(() => {})
    return () => controller.abort()
  }, [picks.length, query])

  const items = loaded?.query === query ? loaded.items : []
  if (picks.length === 0 || items.length < 3) return null

  return (
    <section className="page-container section-y" aria-labelledby="para-voce-titulo">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id="para-voce-titulo" className="text-2xl font-bold text-foreground sm:text-3xl">
            Escolhidas para você
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {picks.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/categoria/${slug}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-border px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.find((c) => c.slug === slug)?.name ?? slug}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(WELCOME_OPEN))}
          className="flex min-h-9 shrink-0 items-center rounded-full border border-border px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Mudar preferências
        </button>
      </div>
      <Shelf name="para-voce">
        <ProductCarousel ariaLabel="Escolhidas para você" items={items.map((product) => ({ product }))} />
      </Shelf>
    </section>
  )
}
