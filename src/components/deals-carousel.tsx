"use client"

import { motion } from "framer-motion"
import { Clock } from "lucide-react"
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
  subtitle = "Encontradas há pouco pelo HibridLink nas lojas parceiras.",
  icon = <Clock className="h-5 w-5" aria-hidden />,
}: {
  products: Product[]
  title?: string
  subtitle?: string
  icon?: ReactNode
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
        </div>

        <Carousel
          opts={{ align: "start", loop: false }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="basis-[65%] xs:basis-[55%] sm:basis-1/3 lg:basis-1/4"
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
                  <ProductCard product={product} className="bg-background" />
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex active:scale-90" />
          <CarouselNext className="hidden sm:flex active:scale-90" />
        </Carousel>
      </div>
    </section>
  )
}
