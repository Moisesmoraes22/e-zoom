"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Flame, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { PriceSparkline } from "@/components/price-sparkline";
import { HeroBackdrop } from "@/components/ui/hero-backdrop";
import { SearchBar } from "@/components/search-bar";
import type { HeroOffer } from "@/lib/hero";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { cn, formatCurrency } from "@/lib/utils";

/** Below this the hero is the compact text + search version: no offers, no timer. */
const DESKTOP = "(min-width: 1024px)";
const ROTATE_MS = 7000;

const subscribeDesktop = (onChange: () => void) => {
  const media = window.matchMedia(DESKTOP);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const useIsDesktop = () =>
  useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );

export function CommerceHero({
  storeNames,
  offers,
  showcase = [],
}: {
  /** Best-discount offers shown as a strip on the first screen. */
  showcase?: Product[];
  storeNames: string[];
  /** Up to 4 real offers to rotate. Without any, the hero is text and search only. */
  offers: HeroOffer[];
}) {
  const count = offers.length;
  const [index, setIndex] = useState(0);
  // False until the first slide change, so the first paint keeps its intro animation.
  const [rotated, setRotated] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isDesktop = useIsDesktop();
  const active = count > 0 ? offers[index % count] : null;
  const paused = hovered || focused;

  // In-memory rotation only (no requests). The timer restarts on every slide
  // change, so clicking an arrow or dot gives the new slide a full interval.
  useEffect(() => {
    if (!isDesktop || count < 2 || paused) return;
    const timer = setTimeout(() => {
      setRotated(true);
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, paused, isDesktop, count]);

  // Warm the other slides' photos so a swap never shows an empty frame.
  useEffect(() => {
    if (!isDesktop || count < 2) return;
    offers.slice(1).forEach((offer) => {
      new Image().src = offer.image;
    });
  }, [isDesktop, count, offers]);

  const go = (next: number) => {
    setRotated(true);
    setIndex((next + count) % count);
  };

  return (
    <div className="page-container relative">
      <section
        className="relative mt-3 rounded-3xl sm:mt-4 border border-border bg-accent/40"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        // Pause for keyboard focus (arrows, dots, typing in the search), but not
        // for the focus a mouse click leaves behind, or it would never resume.
        onFocus={(event) => setFocused((event.target as HTMLElement).matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {/* Decoration only; clipped on its own so the search dropdown can overflow the hero. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <HeroBackdrop />
        </div>

        <div
          className={cn(
            "relative grid items-center gap-10 px-5 py-6 sm:px-10 sm:py-12 lg:py-8",
            active && "lg:grid-cols-[1.1fr_0.9fr] lg:gap-12",
          )}
        >
          {/* No entrance animation: it ships as opacity 0, hiding the h1 until hydration (slow LCP on phones). */}
          <div className={cn(!active && "mx-auto max-w-2xl text-center")}>
            <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight sm:mb-3 sm:text-4xl lg:text-5xl">
              <span className="text-foreground">Encontre </span>
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                ofertas
              </span>
              <span className="text-foreground"> que realmente valem a pena.</span>
            </h1>
            <p className="mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-lg">
              <span className="sm:hidden">Compare preços e ache o melhor preço.</span>
              <span className="hidden sm:inline">
                Compare preços e descubra onde comprar pelo melhor preço.
              </span>
            </p>

            <SearchBar className="max-w-xl" />

            {storeNames.length > 0 && (
              <p
                className={cn(
                  "mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:mt-4 text-muted-foreground sm:text-sm",
                  !active && "justify-center",
                )}
              >
                <span>Ofertas de</span>
                {storeNames.map((name, i) => (
                  <span key={name} className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{name}</span>
                    {i < storeNames.length - 1 && <span aria-hidden>·</span>}
                  </span>
                ))}
              </p>
            )}
          </div>

          {active && (
            <div className="group/slides relative mx-auto hidden w-full max-w-[26rem] lg:block">
              <AnimatePresence mode="wait">
                <HeroSlide key={active.id} offer={active} intro={!rotated} />
              </AnimatePresence>

              {count > 1 && (
                <>
                  <div
                    role="group"
                    aria-label="Escolher oferta do Hero"
                    className="absolute inset-x-0 -bottom-7 flex justify-center"
                  >
                    {offers.map((offer, i) => (
                      <button
                        key={offer.id}
                        type="button"
                        aria-label={`Mostrar oferta ${i + 1} de ${count}`}
                        aria-current={i === index % count}
                        onClick={() => go(i)}
                        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            i === index % count ? "w-5 bg-primary" : "w-2 bg-foreground/25",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {showcase.length > 0 && <Showcase offers={showcase} />}
      </section>
    </div>
  );
}

/** Real offers with a recorded discount, visible on the first screen (also on phones, where the big card is hidden). */
function Showcase({ offers }: { offers: Product[] }) {
  return (
    <div className="relative px-5 pb-6 sm:px-10 sm:pb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl">
          <Flame className="h-5 w-5 shrink-0 text-discount" aria-hidden />
          Maiores descontos agora
        </h2>
        <Link href="/busca?ordenacao=desconto" className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground hover:underline">
          Ver todas
        </Link>
      </div>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {offers.map((offer) => (
          <li key={offer.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
            <ProductCard product={offer} compact />
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroSlide({ offer, intro }: { offer: HeroOffer; intro: boolean }) {
  const reduce = useReducedMotion();
  // Where the pointer is over the photo stage, -0.5..0.5; smoothed by a spring so the tilt eases.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 110, damping: 14 });
  const sy = useSpring(py, { stiffness: 110, damping: 14 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-7, 7]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [6, -6]);
  const shiftX = useTransform(sx, [-0.5, 0.5], [-8, 8]);
  const shiftY = useTransform(sy, [-0.5, 0.5], [-6, 6]);

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: intro ? 0.5 : 0.4, delay: intro ? 0.15 : 0, ease: "easeOut" }}
    >
      <Link
        href={`/produto/${offer.id}`}
        aria-label={`Ver detalhes da oferta: ${offer.title}`}
        className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {/* Product photos sit on white, so the stage stays white in both themes. */}
        <div
          className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-xl shadow-foreground/10 ring-1 ring-border"
          onPointerMove={(e) => {
            if (reduce) return;
            const r = e.currentTarget.getBoundingClientRect();
            px.set((e.clientX - r.left) / r.width - 0.5);
            py.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onPointerLeave={() => {
            px.set(0);
            py.set(0);
          }}
        >
          {/* Three layers, each animating its own property: tilt toward the pointer (style),
              entrance after the card (initial/animate), and a slow endless float. All
              transform/opacity only; none of it runs with "reduce motion". */}
          <motion.div
            className="h-full w-full"
            style={reduce ? undefined : { rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 900 }}
          >
            <motion.div
              className="h-full w-full"
              initial={reduce ? false : { opacity: 0, y: 24, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: intro ? 0.35 : 0.15, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <motion.div
                className="h-full w-full"
                animate={reduce ? undefined : { y: [0, -9, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={offer.image}
                  alt={offer.title}
                  // Lazy: the card is display:none on phones, so they skip this large photo.
                  loading="lazy"
                  className="h-full w-full object-contain p-5 transition-transform duration-500 motion-safe:group-hover:scale-105"
                />
              </motion.div>
            </motion.div>
          </motion.div>
          {offer.insight && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: intro ? 0.6 : 0.3 }}
              className="absolute bottom-3 left-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-lg shadow-foreground/10 sm:text-sm"
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

        <div className="mt-4 flex items-end justify-between gap-3 rounded-2xl bg-card/90 px-4 py-3 shadow-lg shadow-foreground/10 ring-1 ring-border backdrop-blur-sm">
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
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              <span className="text-2xl font-bold tabular-nums text-price">
                {formatCurrency(offer.price)}
              </span>
              {offer.originalPrice && (
                <span className="text-sm tabular-nums text-muted-foreground line-through">
                  {formatCurrency(offer.originalPrice)}
                </span>
              )}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand">
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
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: intro ? 0.45 : 0.15 }}
          className="pointer-events-none absolute -right-2 -top-3 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-discount text-discount-foreground shadow-lg shadow-discount/30 sm:-right-4 sm:h-24 sm:w-24"
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
