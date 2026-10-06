"use client"

import Link from "next/link"

import { ProductCarousel } from "@/components/product-carousel"
import { SectionHeader, type IconTone } from "@/components/section-header"
import type { Product } from "@/lib/types"

/** A home section: title, then the offers in one row with arrows. */
export function ProductRow({
  title,
  subtitle,
  products,
  href = "/busca",
  linkLabel,
  icon,
  iconTone,
  cardLabel,
  chips,
}: {
  title: string
  subtitle?: string
  products: Product[]
  href?: string
  linkLabel?: string
  icon?: React.ReactNode
  iconTone?: IconTone
  /** Tag shown on every card of this section. */
  cardLabel?: string
  /** Quick links above the row (e.g. sort orders of the full listing). */
  chips?: { label: string; href: string }[]
}) {
  return (
    <section className="page-container section-y">
      <SectionHeader title={title} subtitle={subtitle} href={href} linkLabel={linkLabel} icon={icon} tone={iconTone} />
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
      <ProductCarousel items={products.map((product) => ({ product, label: cardLabel }))} />
    </section>
  )
}
