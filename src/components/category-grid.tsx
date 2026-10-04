"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { SectionHeader } from "@/components/section-header"
import type { CategoryCount } from "@/lib/deals"

export function CategoryGrid({
  categories,
  showCounts,
}: {
  categories: CategoryCount[]
  showCounts: boolean
}) {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        title="Categorias populares"
        subtitle="Navegue pelas ofertas por tipo de produto"
        href="/busca"
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.slug}
            className="h-full"
            initial={{ opacity: 0, y: 16 }}
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
              className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center transition-colors duration-300 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
            >
              <div className="h-16 w-16 overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all duration-300 group-hover:ring-primary/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-110"
                />
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
