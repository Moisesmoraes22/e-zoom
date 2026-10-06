"use client"

import { motion } from "framer-motion"

import { ProductCard } from "@/components/product-card"
import { SectionHeader } from "@/components/section-header"
import type { Product } from "@/lib/types"

export function ProductGrid({
  title,
  subtitle,
  products,
  href = "/busca",
  linkLabel,
  icon,
  cardLabel,
}: {
  title: string
  subtitle?: string
  products: Product[]
  href?: string
  linkLabel?: string
  icon?: React.ReactNode
  /** Tag shown on every card of this section. */
  cardLabel?: string
}) {
  return (
    <section className="container mx-auto max-w-7xl px-4 py-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        href={href}
        linkLabel={linkLabel}
        icon={icon}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.35,
              delay: (index % 4) * 0.06,
              ease: "easeOut",
            }}
            className="h-full"
          >
            <ProductCard product={product} label={cardLabel} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
