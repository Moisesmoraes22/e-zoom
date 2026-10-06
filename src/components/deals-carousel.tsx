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
  tone = "navy",
}: {
  products: Product[]
  title?: string
  subtitle?: string
  icon?: ReactNode
  /** Optional "see all" link shown beside the title. */
  href?: string
  /** "navy" is the dark highlight band; "light" sits on the page background. */
  tone?: "navy" | "light"
}) {
  const navy = tone === "navy"
  return (
    <section className={navy ? "bg-band py-12" : "section-y"}>
      <div className="page-container">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {icon}
          </span>
          <div>
            <h2 className={`text-2xl font-bold sm:text-3xl ${navy ? "text-band-foreground" : "text-foreground"}`}>
              {title}
            </h2>
            <p className={`text-sm ${navy ? "text-band-foreground/70" : "text-muted-foreground"}`}>{subtitle}</p>
          </div>
          {href && (
            <Link href={href} className="ml-auto shrink-0 text-sm font-semibold text-brand hover:underline">
              Ver todas
            </Link>
          )}
        </div>

        <Carousel
          opts={{ align: "start", loop: products.length > 8 }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="basis-[40%] sm:basis-[28.57%] md:basis-[22.22%] lg:basis-[18.18%] xl:basis-[15.38%]"
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
                  <ProductCard product={product} className={navy ? "bg-background" : undefined} compact />
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
