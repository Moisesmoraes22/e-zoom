"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { SectionHeader } from "@/components/section-header"
import { useCards } from "@/lib/use-cards"
import type { Product } from "@/lib/types"

// The carousel code is fetched only when the first shelf is about to be seen, not with the page.
const ProductRow = dynamic(() => import("@/components/product-row").then((m) => m.ProductRow), { ssr: false })

/**
 * A home shelf that costs nothing until it is near the screen: the page carries only its title, links and
 * the ids of its offers. When it is within ~700 px of the viewport the offers are fetched (/api/cards, cached)
 * and the carousel replaces the placeholder. The choice of offers stays on the server (same ranking as before).
 */
export function LazyProductRow({
  ids,
  title,
  href = "/busca",
  linkLabel,
  chips,
}: {
  ids: string[]
  title: string
  href?: string
  linkLabel?: string
  chips?: { label: string; href: string }[]
}) {
  const ref = useRef<HTMLElement>(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (!("IntersectionObserver" in window)) {
      queueMicrotask(() => setNear(true)) // old browsers: no observer, so the shelf simply loads
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: "700px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [near])

  const { cards, failed, retry } = useCards(near ? ids : [], [])
  const products = ids.map((id) => cards.get(id)).filter((p): p is Product => !!p)

  if (near && products.length > 0) {
    return <ProductRow title={title} products={products} href={href} linkLabel={linkLabel} chips={chips} />
  }

  return (
    <section ref={ref} className="page-container section-y" aria-label={title}>
      <SectionHeader title={title} href={href} linkLabel={linkLabel} />
      {chips && (
        <div className="mb-4 flex flex-wrap gap-2">
          {chips.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex min-h-9 items-center rounded-full border border-border px-3.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {c.label}
            </Link>
          ))}
        </div>
      )}
      {/* Reserves the carousel's height so the page does not jump when the offers arrive. */}
      <div className="flex h-[22rem] items-center justify-center rounded-2xl bg-muted/40" aria-hidden={!failed}>
        {failed && (
          <button
            type="button"
            onClick={retry}
            className="min-h-11 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Não foi possível carregar. Tentar de novo
          </button>
        )}
      </div>
    </section>
  )
}
