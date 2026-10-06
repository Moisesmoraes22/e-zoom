"use client"

import { motion } from "framer-motion"
import { Clock } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { ProductCard } from "@/components/product-card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import type { Product } from "@/lib/types"

export function DealsCarousel({
  products,
  title = "Ofertas recém-encontradas",
  subtitle = "Encontradas há pouco pelo E-Zoom nas lojas parceiras.",
  icon = <Clock className="h-5 w-5" aria-hidden />,
  href,
}: {
  products: Product[]
  title?: string
  subtitle?: string
  icon?: ReactNode
  /** Optional "see all" link shown beside the title. */
  href?: string
}) {
  return (
    <section className="bg-band py-12">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {icon}
          </span>
          <div>
            <h2 className="text-2xl font-bold text-band-foreground sm:text-3xl">
              {title}
            </h2>
            <p className="text-sm text-band-foreground/70">{subtitle}</p>
          </div>
          {href && (
            <Link href={href} className="ml-auto shrink-0 text-sm font-semibold text-brand hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        <Carousel
          opts={{ align: "start", loop: products.length > 6 }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="basis-[46%] sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  className="h-full"
                >
                  <ProductCard product={product} className="bg-background" compact />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-2 active:scale-90 sm:-left-4" />
          <CarouselNext className="-right-2 active:scale-90 sm:-right-4" />
        </Carousel>
      </div>
    </section>
  )
}
