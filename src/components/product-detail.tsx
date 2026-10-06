"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  Award,
  ArrowRight,
  ChevronDown,
  Bookmark,
  LineChart,
  Star,
  TrendingDown,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef } from "react"

import { OfferLink } from "@/components/offer-link"
import { PriceSparkline } from "@/components/price-sparkline"
import { StoreBadge } from "@/components/store-badge"
import { TimeAgo } from "@/components/time-ago"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { discountOf, savingsOf } from "@/lib/deals"
import { useFavorites } from "@/lib/favorites-context"
import { recordProduct } from "@/lib/interest-profile"
import { CATEGORIES, STORES } from "@/lib/mock-data"
import type { PriceStats, Product, ProductOffer } from "@/lib/types"
import {
  calculateDiscountPercent,
  cn,
  formatCurrency,
  formatDay,
  formatReviewCount,
  formatSeenAt,
} from "@/lib/utils"

export function ProductDetail({
  product,
  offers,
  stats,
}: {
  product: Product
  offers: ProductOffer[]
  /** Full recorded price history (live products only). */
  stats: PriceStats | null
}) {
  const { toggleFavorite, isFavorite, launchFlight } = useFavorites()
  const favorited = isFavorite(product.id)
  useEffect(() => recordProduct("view", product), [product])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const bestOffer = offers[0]
  const category = CATEGORIES.find((c) => c.slug === product.category)
  const discount = discountOf(product)
  const savings = savingsOf(product)

  const handleToggle = () => {
    if (!favorited && buttonRef.current) {
      launchFlight(buttonRef.current, product.image)
    }
    toggleFavorite(product)
  }

  // Claims below only appear when the recorded history actually supports them.
  const tracked = stats && stats.points.length >= 2 && stats.max > stats.min ? stats : null
  const isLowest = !!tracked && product.price <= tracked.min
  const belowAverage =
    tracked && tracked.points.length >= 3 && product.price < tracked.average * 0.98
      ? calculateDiscountPercent(product.price, tracked.average)
      : null
  const recentPoints = tracked ? tracked.points.slice(-30) : []

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <nav aria-label="Você está em" className="mb-5 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-foreground hover:underline">
              Início
            </Link>
          </li>
          {category && (
            <>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={`/categoria/${category.slug}`}
                  className="hover:text-foreground hover:underline"
                >
                  {category.name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        <div className="relative aspect-square self-start overflow-hidden rounded-2xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover"
          />
          {discount && (
            <Badge className="absolute left-3 top-3 bg-discount text-discount-foreground hover:bg-discount">
              -{discount}%
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <StoreBadge store={product.store} variant="minimal" />
            <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {product.title}
            </h1>
            {product.rating && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" aria-hidden />
                <span className="font-semibold text-foreground">
                  {product.rating.toFixed(1)}
                </span>
                {product.reviewsCount && (
                  <span>{formatReviewCount(product.reviewsCount)} avaliações</span>
                )}
              </div>
            )}
          </div>

          <section
            aria-label="Preço"
            className="rounded-2xl border border-border bg-card p-5"
          >
            <p className="text-sm text-muted-foreground">
              Preço atual em {STORES[bestOffer.store].name}
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-price">
              {formatCurrency(bestOffer.price)}
            </p>

            {(discount || isLowest) && (
              <div className="mt-2 flex flex-col gap-1.5 text-sm">
                {product.originalPrice && discount && (
                  <p className="text-muted-foreground">
                    Antes{" "}
                    <span className="tabular-nums line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  </p>
                )}
                {savings && (
                  <p className="flex items-center gap-1.5 font-medium text-brand">
                    <TrendingDown className="h-4 w-4" aria-hidden />
                    Economize {formatCurrency(savings)} ({discount}%)
                  </p>
                )}
                {isLowest && (
                  <p className="flex items-center gap-1.5 font-medium text-brand">
                    <Award className="h-4 w-4" aria-hidden />
                    Menor preço que registramos
                  </p>
                )}
              </div>
            )}

            {bestOffer.isFreeShipping && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-success">
                <Truck className="h-4 w-4" aria-hidden />
                Frete grátis
              </p>
            )}

            {product.seenAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Preço visto em {formatSeenAt(product.seenAt)}{" "}
                (<TimeAgo iso={product.seenAt} relativeOnly />). Preços e
                disponibilidade podem mudar na loja de origem.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="flex-1 gap-2 rounded-full bg-cta text-cta-foreground hover:bg-cta-hover">
                <OfferLink
                  product={product}
                  store={bestOffer.store}
                  affiliateUrl={bestOffer.affiliateUrl}
                >
                  Ver oferta
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </OfferLink>
              </Button>
              <motion.button
                ref={buttonRef}
                type="button"
                aria-pressed={favorited}
                onClick={handleToggle}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  favorited
                    ? "border-primary bg-primary/10 text-brand"
                    : "border-border text-foreground hover:border-primary/50 hover:text-brand",
                )}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={favorited ? "on" : "off"}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bookmark className={cn("h-4 w-4", favorited && "fill-current")} aria-hidden />
                  </motion.span>
                </AnimatePresence>
                {favorited ? "Favoritado" : "Favoritar"}
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Ao clicar em “Ver oferta” você é levado à página da loja para
              finalizar a compra por lá.
            </p>
          </section>

          <section
            aria-labelledby="historico"
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2
              id="historico"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <LineChart className="h-4 w-4 text-brand" aria-hidden />
              Histórico de preço
            </h2>

            {tracked ? (
              <>
                <PriceSparkline
                  values={recentPoints.map((p) => p.price)}
                  className="mt-3 h-16 w-full text-brand"
                />
                <p className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatDay(recentPoints[0].at)}</span>
                  <span>hoje</span>
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Atual</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(product.price)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Menor registrado</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(tracked.min)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Maior registrado</dt>
                    <dd className="font-semibold tabular-nums text-foreground">
                      {formatCurrency(tracked.max)}
                    </dd>
                  </div>
                </dl>
                {belowAverage && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand">
                    <TrendingDown className="h-4 w-4" aria-hidden />
                    {belowAverage}% abaixo da média do período ({formatCurrency(tracked.average)})
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Acompanhamos este preço desde {formatDay(tracked.since)} ·{" "}
                  {tracked.points.length} registros. Só aparecem preços que o
                  E-Zoom viu; não há dados de antes disso.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {stats
                  ? `Acompanhamos este preço desde ${formatDay(stats.since)} e ele ainda não mudou. `
                  : "Ainda estamos começando a acompanhar este preço. "}
                O histórico aparece aqui assim que ele variar.
              </p>
            )}
          </section>

          <details className="group rounded-2xl border border-border bg-card px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between rounded-md text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Informações do produto
              <ChevronDown
                className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Loja</dt>
              <dd className="text-foreground">{STORES[product.store].name}</dd>
              {category && (
                <>
                  <dt className="text-muted-foreground">Categoria</dt>
                  <dd className="text-foreground">{category.name}</dd>
                </>
              )}
              {product.createdAt && (
                <>
                  <dt className="text-muted-foreground">Encontrada em</dt>
                  <dd className="text-foreground">{formatSeenAt(product.createdAt)}</dd>
                </>
              )}
              {product.isFreeShipping && (
                <>
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="text-foreground">Grátis</dd>
                </>
              )}
            </dl>
          </details>
        </div>
      </div>

      {offers.length > 1 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold text-foreground">Onde comprar</h2>
          <div className="overflow-hidden rounded-2xl border border-border">
            {offers.map((offer, index) => {
              const offerDiscount = calculateDiscountPercent(offer.price, offer.originalPrice)
              return (
                <div
                  key={offer.store}
                  className={cn(
                    "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                    index !== offers.length - 1 && "border-b border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <StoreBadge store={offer.store} />
                    {offer.isFreeShipping && (
                      <span className="flex items-center gap-1 text-xs font-medium text-success">
                        <Truck className="h-3.5 w-3.5" aria-hidden />
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
                      <p className="text-lg font-bold tabular-nums text-foreground">
                        {formatCurrency(offer.price)}
                      </p>
                      {offerDiscount && (
                        <p className="text-xs font-semibold text-brand">-{offerDiscount}%</p>
                      )}
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
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
        </div>
      )}
    </div>
  )
}
