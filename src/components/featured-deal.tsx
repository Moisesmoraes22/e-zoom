"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Flame, Heart, Star } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { OfferLink } from "@/components/offer-link"
import { StoreBadge } from "@/components/store-badge"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/favorites-context"
import type { Product } from "@/lib/types"
import { calculateDiscountPercent, formatCurrency, formatReviewCount } from "@/lib/utils"

const ROTATE_INTERVAL_MS = 5000

export function FeaturedDeal({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const product = products[index % products.length]
  const favorited = isFavorite(product.id)
  const discount = calculateDiscountPercent(product.price, product.originalPrice)

  useEffect(() => {
    if (products.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % products.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [products.length])

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!favorited && buttonRef.current) {
      launchFlight(buttonRef.current, product.image)
    }
    toggleFavorite(product)
  }

  return (
    <section className="container mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Flame className="h-5 w-5 fill-current" />
        </span>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          Oferta em destaque
        </h2>
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card md:flex-row">
        <AnimatePresence mode="wait">
          <motion.div
            key={product.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-1 flex-col md:flex-row"
          >
            <Link
              href={`/produto/${product.id}`}
              className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted md:aspect-auto md:w-[45%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </Link>

            <div className="flex flex-1 flex-col justify-center gap-3 p-6 sm:p-10">
              {discount && (
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  -{discount}% OFF
                </span>
              )}

              <Link href={`/produto/${product.id}`}>
                <h3 className="text-xl font-bold text-foreground transition-colors hover:text-primary sm:text-2xl lg:text-3xl">
                  {product.title}
                </h3>
              </Link>

              {product.rating && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium text-foreground">
                    {product.rating.toFixed(1)}
                  </span>
                  {product.reviewsCount && (
                    <span>
                      ({formatReviewCount(product.reviewsCount)} avaliações)
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary sm:text-4xl">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              <StoreBadge store={product.store} variant="minimal" />

              <Button
                asChild
                className="mt-2 w-full gap-2 rounded-full sm:w-fit sm:px-8 active:scale-95"
              >
                <OfferLink
                  product={product}
                  store={product.store}
                  affiliateUrl={product.affiliateUrl}
                >
                  Ver oferta
                  <ArrowRight className="h-4 w-4" />
                </OfferLink>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        <motion.button
          ref={buttonRef}
          type="button"
          aria-pressed={favorited}
          aria-label={
            favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          onClick={handleToggle}
          whileTap={{ scale: 0.82 }}
          animate={favorited ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={favorited ? "filled" : "outline"}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
            >
              <Heart className={favorited ? "h-5 w-5 fill-current" : "h-5 w-5"} />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>
    </section>
  )
}
