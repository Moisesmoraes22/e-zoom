"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Heart, Star, Truck } from "lucide-react"

import { OfferLink } from "@/components/offer-link"
import { StoreBadge } from "@/components/store-badge"
import { Badge } from "@/components/ui/badge"
import { useFavorites } from "@/lib/favorites-context"
import type { Product } from "@/lib/types"
import { cn, formatCurrency, formatReviewCount } from "@/lib/utils"

export function ProductCard({
  product,
  className,
}: {
  product: Product
  className?: string
}) {
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const favorited = isFavorite(product.id)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleToggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!favorited && buttonRef.current) {
      launchFlight(buttonRef.current, product.image)
    }
    toggleFavorite(product)
  }

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
        favorited
          ? "border-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
          : "border-border",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <Link
          href={`/produto/${product.id}`}
          className="flex flex-1 flex-col active:scale-[0.98] transition-transform duration-150"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            {product.discountLabel && (
              <Badge className="absolute left-2 top-2 z-10 bg-primary text-primary-foreground">
                {product.discountLabel}
              </Badge>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-1 flex-col gap-2 p-4 pb-3">
            <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">
              {product.title}
            </h3>

            {product.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
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

            <div className="flex flex-col gap-0.5">
              <span className="text-xl font-bold text-primary">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
              )}
              {product.installments && (
                <span className="text-xs text-muted-foreground">
                  em {product.installments.count}x de{" "}
                  {formatCurrency(product.installments.value)}
                </span>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between gap-2">
              <StoreBadge store={product.store} variant="minimal" />
              {product.isFreeShipping && (
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Truck className="h-3.5 w-3.5" />
                  Grátis
                </span>
              )}
            </div>
          </div>
        </Link>

        <div className="px-4 pb-4">
          <OfferLink
            product={product}
            store={product.store}
            affiliateUrl={product.affiliateUrl}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/40 py-2 text-sm font-semibold text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground"
          >
            Ver oferta
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </OfferLink>
        </div>
      </div>

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
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={cn(
          "absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors duration-300",
          favorited
            ? "bg-primary text-primary-foreground"
            : "bg-background/90 text-foreground backdrop-blur-sm hover:bg-primary hover:text-primary-foreground",
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {favorited ? (
            <motion.span
              key="filled"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Heart className="h-4 w-4 fill-current" />
            </motion.span>
          ) : (
            <motion.span
              key="outline"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Heart className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
