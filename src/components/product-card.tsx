"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Heart, Star, TrendingDown, Truck } from "lucide-react"

import { OfferLink } from "@/components/offer-link"
import { PriceSparkline } from "@/components/price-sparkline"
import { StoreBadge } from "@/components/store-badge"
import { AgeDot, TimeAgo } from "@/components/time-ago"
import { Badge } from "@/components/ui/badge"
import { discountOf } from "@/lib/deals"
import { useFavorites } from "@/lib/favorites-context"
import { cardImage } from "@/lib/image-url"
import { unitPrice } from "@/lib/unit-price"
import type { Product } from "@/lib/types"
import {
  calculateDiscountPercent,
  cn,
  formatCurrency,
  formatReviewCount,
} from "@/lib/utils"

export function ProductCard({
  product,
  className,
  label,
  compact = false,
}: {
  product: Product
  className?: string
  /** Tighter padding and type, for rows with 5-6 cards side by side. */
  compact?: boolean
  /** Small tag above the title, e.g. "Achado E-Zoom". */
  label?: string
}) {
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const favorited = isFavorite(product.id)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const discount = discountOf(product)
  const unit = product.category === "suplementos" ? unitPrice(product.title, product.price) : null

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
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10",
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
            {discount && (
              <Badge className="absolute left-2 top-2 z-10 bg-primary text-primary-foreground">
                -{discount}%
              </Badge>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImage(product.image)}
              alt={product.title}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.src !== product.image) e.currentTarget.src = product.image
              }}
              className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            />
          </div>

          <div className={cn("flex flex-1 flex-col", compact ? "gap-1.5 p-3.5 pb-2" : "gap-2 p-4 pb-2")}>
            {label && (
              <span className="-mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
                {label}
              </span>
            )}
            <h3 className={cn("line-clamp-2 min-h-[2.4rem] font-medium text-foreground", "text-sm leading-snug")}>
              {product.title}
            </h3>

            {product.rating && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="font-medium text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviewsCount && (
                  <span>({formatReviewCount(product.reviewsCount)})</span>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn("font-bold tabular-nums text-brand", "text-xl")}>
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && discount && (
                  <span className="text-xs tabular-nums text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.isPriceDrop && product.priceHistory && (
                <span className="flex items-center gap-2 text-xs font-medium text-brand">
                  <PriceSparkline values={product.priceHistory} className="h-5 w-14" />
                  Caiu {formatCurrency(product.priceHistory.at(-2)! - product.price)} ({calculateDiscountPercent(product.price, product.priceHistory.at(-2)!)}%)
                </span>
              )}
              {!(product.isPriceDrop && product.priceHistory) && unit && (
                <span className="text-xs font-medium text-muted-foreground">
                  {formatCurrency(unit.value)}/{unit.unit}
                </span>
              )}
              {!(product.isPriceDrop && product.priceHistory) && !unit && product.installments && (
                <span className="text-xs text-muted-foreground">
                  em {product.installments.count}x de{" "}
                  {formatCurrency(product.installments.value)}
                </span>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-1 pt-1.5">
              <div className="flex items-center justify-between gap-2">
                <StoreBadge store={product.store} variant="minimal" />
                {product.isFreeShipping && (
                  <span className="flex items-center gap-1 text-xs font-medium text-brand">
                    <Truck className="h-3.5 w-3.5" aria-hidden />
                    Frete grátis
                  </span>
                )}
              </div>
              {product.seenAt && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
                  <AgeDot iso={product.seenAt} />
                  <span>
                    Visto <TimeAgo iso={product.seenAt} />
                  </span>
                </span>
              )}
            </div>
          </div>
        </Link>

        {product.variants && (
          <Link
            href={`/busca?q=${encodeURIComponent(product.variants.query)}`}
            className={cn(
              "mb-3 text-xs font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "mx-3.5" : "mx-4",
            )}
          >
            +{product.variants.count} {product.variants.count === 1 ? product.variants.noun.replace(/res$/, "r").replace("opções", "opção") : product.variants.noun} · ver todos
          </Link>
        )}

        <div className={compact ? "px-3.5 pb-3.5" : "px-4 pb-4"}>
          <OfferLink
            product={product}
            store={product.store}
            affiliateUrl={product.affiliateUrl}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ver oferta
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
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
