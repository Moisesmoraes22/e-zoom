"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Heart, Star, Truck } from "lucide-react"
import { useRef } from "react"

import { OfferLink } from "@/components/offer-link"
import { PriceSparkline } from "@/components/price-sparkline"
import { StoreBadge } from "@/components/store-badge"
import { Button } from "@/components/ui/button"
import { STORES } from "@/lib/mock-data"
import { useFavorites } from "@/lib/favorites-context"
import type { Product, ProductOffer } from "@/lib/types"
import {
  calculateDiscountPercent,
  formatCurrency,
  formatReviewCount,
  formatSeenAt,
} from "@/lib/utils"

export function ProductDetail({
  product,
  offers,
}: {
  product: Product
  offers: ProductOffer[]
}) {
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const favorited = isFavorite(product.id)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const bestOffer = offers[0]

  const handleToggle = () => {
    if (!favorited && buttonRef.current) {
      launchFlight(buttonRef.current, product.image)
    }
    toggleFavorite(product)
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
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
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
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

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.category}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              {product.title}
            </h1>
          </div>

          {product.rating && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-brand" />
              <span className="font-semibold text-foreground">
                {product.rating.toFixed(1)}
              </span>
              {product.reviewsCount && (
                <span>
                  {formatReviewCount(product.reviewsCount)} avaliações
                </span>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Melhor oferta encontrada
            </p>
            <p className="text-3xl font-bold text-brand">
              {formatCurrency(bestOffer.price)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              em {STORES[bestOffer.store].name}
            </p>
            {product.seenAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Preço visto em {formatSeenAt(product.seenAt)}. Preços e
                disponibilidade podem mudar a qualquer momento.
              </p>
            )}
          </div>

          {product.priceHistory && (
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Histórico de preços
              </p>
              <PriceSparkline
                values={product.priceHistory}
                className="mt-2 h-12 w-full text-brand"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Menor {formatCurrency(Math.min(...product.priceHistory))} · maior{" "}
                {formatCurrency(Math.max(...product.priceHistory))} ·{" "}
                {product.priceHistory.length} registros
              </p>
            </div>
          )}

          <Button asChild className="w-full gap-2 rounded-full active:scale-95">
            <OfferLink
              product={product}
              store={bestOffer.store}
              affiliateUrl={bestOffer.affiliateUrl}
            >
              Ver oferta
            </OfferLink>
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          Onde comprar
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border">
          {offers.map((offer, index) => {
            const discount = calculateDiscountPercent(
              offer.price,
              offer.originalPrice,
            )
            return (
              <div
                key={offer.store}
                className={
                  "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between " +
                  (index !== offers.length - 1 ? "border-b border-border" : "")
                }
              >
                <div className="flex items-center gap-3">
                  <StoreBadge store={offer.store} />
                  {offer.isFreeShipping && (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand">
                      <Truck className="h-3.5 w-3.5" />
                      Frete grátis
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {offer.originalPrice && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(offer.originalPrice)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(offer.price)}
                    </p>
                    {discount && (
                      <p className="text-xs font-semibold text-brand">
                        -{discount}%
                      </p>
                    )}
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full active:scale-95"
                  >
                    <OfferLink
                      product={product}
                      store={offer.store}
                      affiliateUrl={offer.affiliateUrl}
                    >
                      Ver oferta
                    </OfferLink>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Preços encontrados nas lojas parceiras no momento da consulta. Ao
          clicar em &quot;Ver oferta&quot;, você é redirecionado para
          finalizar a compra diretamente na loja escolhida.
        </p>
      </div>
    </div>
  )
}
