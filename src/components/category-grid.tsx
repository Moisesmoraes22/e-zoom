"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import { categoryIcon } from "@/lib/category-icons"
import type { CategoryCount } from "@/lib/deals"

export function CategoryGrid({
  categories,
  showCounts,
  withHeader = true,
  gridClassName = "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8",
}: {
  categories: CategoryCount[]
  showCounts: boolean
  /** Off on /categorias, where the page has its own h1. */
  withHeader?: boolean
  gridClassName?: string
}) {
  return (
    <section className="page-container section-y">
      {withHeader && (
        <SectionHeader
          title="Categorias populares"
          href="/categorias"
          linkLabel="Ver todas as categorias"
        />
      )}
      <div className={`grid gap-4 ${gridClassName}`}>
        {categories.map((category, index) => (
          <motion.div
            key={category.slug}
            className="h-full"
            // First row ships visible; animating from opacity 0 would hide it until hydration.
            initial={index < 4 ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.35,
              delay: index * 0.05,
              ease: "easeOut",
            }}
          >
            <Link
              href={`/categoria/${category.slug}`}
              className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all duration-300 group-hover:ring-primary/50">
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
                  />
                ) : (
                  (() => {
                    const Icon = categoryIcon(category.slug)
                    return <Icon className="h-7 w-7 text-brand" aria-hidden />
                  })()
                )}
              </div>
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-foreground sm:text-sm">
                  {category.name}
                </span>
                {showCounts && (
                  <span className="text-[11px] text-muted-foreground">
                    {category.count} {category.count === 1 ? "oferta" : "ofertas"}
                  </span>
                )}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
