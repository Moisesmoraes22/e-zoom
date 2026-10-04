"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingDown } from "lucide-react";
import Link from "next/link";

import { PriceSparkline } from "@/components/price-sparkline";
import { SearchBar } from "@/components/search-bar";
import type { HeroOffer } from "@/lib/hero";
import { cn, formatCurrency } from "@/lib/utils";

export function CommerceHero({
  storeNames,
  offer,
}: {
  storeNames: string[];
  /** A real offer to showcase. Without one the hero is text and search only. */
  offer: HeroOffer | null;
}) {
  return (
    <div className="container relative mx-auto max-w-7xl px-2">
      <section className="relative mt-4 rounded-3xl border border-border bg-accent/40">
        {/* Decoration only; clipped on its own so the search dropdown can overflow the hero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div
          className={cn(
            "relative grid items-center gap-7 px-5 py-8 sm:gap-10 sm:px-10 sm:py-12 lg:py-14",
            offer && "lg:grid-cols-[1.1fr_0.9fr] lg:gap-12",
          )}
        >
          <motion.div
            className={cn(!offer && "mx-auto max-w-2xl text-center")}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              <span className="text-foreground">Encontre </span>
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                ofertas
              </span>
              <span className="text-foreground"> que realmente valem a pena.</span>
            </h1>
            <p className="mb-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Compare preços e descubra onde comprar pelo melhor preço.
            </p>

            <SearchBar className="max-w-xl" />

            {storeNames.length > 0 && (
              <p
                className={cn(
                  "mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:text-sm",
                  !offer && "justify-center",
                )}
              >
                <span>Ofertas de</span>
                {storeNames.map((name, index) => (
                  <span key={name} className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{name}</span>
                    {index < storeNames.length - 1 && <span aria-hidden>·</span>}
                  </span>
                ))}
              </p>
            )}
          </motion.div>

          {offer && <HeroProduct offer={offer} />}
        </div>
      </section>
    </div>
  );
}

function HeroProduct({ offer }: { offer: HeroOffer }) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-[16rem] sm:max-w-sm lg:max-w-[26rem]"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
    >
      <Link
        href={`/produto/${offer.id}`}
        aria-label={`Ver detalhes da oferta: ${offer.title}`}
        className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Product photos sit on white, so the stage stays white in both themes. */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-xl shadow-foreground/10 ring-1 ring-border lg:aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={offer.image}
            alt={offer.title}
            className="h-full w-full object-contain p-5 transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          {offer.insight && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="absolute bottom-3 left-3 hidden items-center sm:flex gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-lg shadow-foreground/10 sm:text-sm"
            >
              {offer.priceHistory && offer.priceHistory.length >= 2 ? (
                <PriceSparkline values={offer.priceHistory} className="h-5 w-10 text-brand" />
              ) : (
                <TrendingDown className="h-4 w-4 text-brand" aria-hidden />
              )}
              {offer.insight}
            </motion.div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 px-1">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: offer.storeColor }}
              />
              {offer.store}
            </p>
            <p className="mt-0.5 line-clamp-1 text-sm font-medium text-foreground">
              {offer.title}
            </p>
            {offer.insight && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-brand sm:hidden">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {offer.insight}
              </p>
            )}
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-bold tabular-nums text-brand">
                {formatCurrency(offer.price)}
              </span>
              {offer.originalPrice && (
                <span className="text-sm tabular-nums text-muted-foreground line-through">
                  {formatCurrency(offer.originalPrice)}
                </span>
              )}
            </p>
          </div>
          <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand sm:flex">
            Ver oferta
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </Link>

      {offer.discount && (
        <motion.div
          aria-label={`${offer.discount}% de desconto`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.45 }}
          className="pointer-events-none absolute -right-2 -top-3 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 sm:-right-4 sm:h-24 sm:w-24"
        >
          <span className="text-2xl font-extrabold leading-none sm:text-3xl">
            -{offer.discount}%
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
            desconto
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
