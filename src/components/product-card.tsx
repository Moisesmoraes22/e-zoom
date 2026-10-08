"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Bookmark, MapPin, Star, Truck } from "lucide-react"

import { OfferLink } from "@/components/offer-link"
import { StoreBadge } from "@/components/store-badge"
import { Badge } from "@/components/ui/badge"
import { discountOf } from "@/lib/deals"
import { useFavorites } from "@/lib/favorites-context"
import { cardImage } from "@/lib/image-url"
import { SELLER_LEADER_LABEL } from "@/lib/seller-leader"
import type { Product } from "@/lib/types"
import {
  cn,
  formatCurrency,
  formatReviewCount,
} from "@/lib/utils"

export function ProductCard({
  product,
  className,
  label,
  compact = false,
  priority = false,
}: {
  product: Product
  className?: string
  /** Tighter padding and type, for rows with 5-6 cards side by side. */
  compact?: boolean
  /** Above-the-fold card: load the photo right away with high priority (it can be the LCP). */
  priority?: boolean
  /** Small tag above the title, e.g. "Achado E-Zoom". */
  label?: string
}) {
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const favorited = isFavorite(product.id)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const discount = discountOf(product)

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
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <Link
          href={`/produto/${product.id}`}
          className="flex flex-1 flex-col active:scale-[0.98] transition-transform duration-150"
        >
          <div className="relative aspect-square w-full overflow-hidden bg-muted">
            <StoreBadge store={product.store} className="absolute bottom-2 left-2 z-10 shadow-sm" />
            {discount && (
              <Badge className="absolute left-2 top-2 z-10 bg-discount text-discount-foreground hover:bg-discount">
                -{discount}%
              </Badge>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardImage(product.image)}
              alt={product.title}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
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

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className={cn("font-bold tabular-nums text-price", "text-xl")}>
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && discount && (
                  <span className="text-xs tabular-nums text-muted-foreground line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {product.installments && (
                <span className="text-xs text-muted-foreground">
                  em {product.installments.count}x de{" "}
                  {formatCurrency(product.installments.value)}
                </span>
              )}
            </div>

            {(product.rating || product.isFreeShipping || product.sellerState || product.sellerLeader) && (
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
                {product.rating && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
                    {product.reviewsCount && <span>({formatReviewCount(product.reviewsCount)})</span>}
                  </span>
                )}
                {product.isFreeShipping && (
                  <span className="flex items-center gap-1 font-medium text-success">
                    <Truck className="h-3.5 w-3.5" aria-hidden />
                    Frete grátis
                  </span>
                )}
                {product.sellerLeader && (
                  <span className="flex items-center gap-1 font-medium text-brand">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                    {SELLER_LEADER_LABEL[product.sellerLeader]}
                  </span>
                )}
                {product.sellerState && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {product.sellerState}
                  </span>
                )}
              </div>
            )}
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
            className="flex min-h-11 items-center justify-center gap-1.5 group/cta rounded-lg bg-cta py-2 text-sm font-semibold text-cta-foreground transition-all duration-200 hover:bg-cta-hover hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ver oferta
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-1" aria-hidden />
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
            : "bg-background/90 text-primary backdrop-blur-sm hover:bg-primary hover:text-primary-foreground",
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
              <Bookmark className="h-4 w-4 fill-current" />
            </motion.span>
          ) : (
            <motion.span
              key="outline"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Bookmark className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
