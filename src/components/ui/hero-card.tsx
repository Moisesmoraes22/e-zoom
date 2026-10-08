"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowRight, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { PriceTrend } from "@/components/price-sparkline";
import type { HeroOffer } from "@/lib/hero";
import { cn, formatCurrency } from "@/lib/utils";

const ROTATE_MS = 7000;

/**
 * Featured offers: a 3D-ish slider (the active card is flat and centred, its neighbours sit
 * back, tilted and dimmed). In memory only, no requests. No arrows: the dots (or a click on a
 * neighbour) pick a slide. Pauses on hover or keyboard focus; stays still with "reduce motion".
 */
export function FeaturedDeal({ offers }: { offers: HeroOffer[] }) {
  const count = offers.length;
  const reduce = useReducedMotion();
  const [current, setCurrent] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused || !!reduce;

  // The timer restarts on every change, so picking a dot gives the new slide a full interval.
  useEffect(() => {
    if (count < 2 || paused) return;
    const timer = setTimeout(() => setCurrent((i) => (i + 1) % count), ROTATE_MS);
    return () => clearTimeout(timer);
  }, [current, paused, count]);

  // Warm the photos so a swap never shows an empty frame.
  useEffect(() => {
    offers.slice(1).forEach((offer) => {
      new Image().src = offer.image;
    });
  }, [offers]);

  if (count === 0) return null;
  return (
    <section aria-label="Ofertas em destaque" className="page-container section-y">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        // Pause for keyboard focus, but not for the focus a mouse click leaves behind.
        onFocus={(event) => setFocused((event.target as HTMLElement).matches(":focus-visible"))}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        <div className="overflow-hidden py-3 [perspective:1200px]">
          <ul
            // --w: slide width in % of the band (the neighbours peek in at both sides); --gap between slides.
            className="flex items-stretch gap-[var(--gap)] transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [--gap:2%] [--w:88%] md:[--w:80%] xl:[--w:72%]"
            style={{ transform: `translateX(calc((100% - var(--w)) / 2 - ${current} * (var(--w) + var(--gap))))` }}
          >
            {offers.map((offer, i) => {
              const active = i === current;
              return (
                <li
                  key={offer.id}
                  aria-hidden={!active}
                  className="relative shrink-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] [transform-origin:bottom]"
                  style={{
                    width: "var(--w)",
                    opacity: active ? 1 : 0.5,
                    transform: active ? "scale(1) rotateX(0deg)" : "scale(0.96) rotateX(8deg)",
                  }}
                >
                  <div
                    inert={!active}
                    className="h-full rounded-3xl border border-border bg-gradient-to-br from-accent/40 to-accent/70 p-4 sm:p-5 lg:p-6"
                  >
                    <Slide offer={offer} active={active} />
                  </div>
                  {!active && (
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Mostrar oferta ${i + 1} de ${count}`}
                      onClick={() => setCurrent(i)}
                      className="absolute inset-0 z-20 cursor-pointer rounded-3xl"
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {count > 1 && (
          <div role="group" aria-label="Escolher oferta em destaque" className="mt-2 flex justify-center">
            {offers.map((offer, i) => (
              <button
                key={offer.id}
                type="button"
                aria-label={`Mostrar oferta ${i + 1} de ${count}`}
                aria-current={i === current}
                onClick={() => setCurrent(i)}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === current ? "w-5 bg-primary" : "w-2 bg-foreground/25",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Slide({ offer, active }: { offer: HeroOffer; active: boolean }) {
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
    <Link
      href={`/produto/${offer.id}`}
      aria-label={`Ver detalhes da oferta: ${offer.title}`}
      className="group grid items-center gap-4 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:grid-cols-[minmax(0,28rem)_minmax(0,34rem)] md:justify-center md:gap-8"
    >
      {/* Product photos sit on white, so the stage stays white in both themes. */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white shadow-xl shadow-foreground/10 ring-1 ring-border"
        onPointerMove={(e) => {
          if (reduce || !active) return;
          const r = e.currentTarget.getBoundingClientRect();
          px.set((e.clientX - r.left) / r.width - 0.5);
          py.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          px.set(0);
          py.set(0);
        }}
      >
        {/* Tilt toward the pointer (style) and a slow endless float, on separate layers. All
            transform only; none of it runs with "reduce motion". */}
        <motion.div
          className="h-full w-full"
          style={reduce ? undefined : { rotateX, rotateY, x: shiftX, y: shiftY, transformPerspective: 900 }}
        >
          <motion.div
            className="h-full w-full"
            animate={reduce || !active ? undefined : { y: [0, -9, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain p-5 transition-transform duration-500 motion-safe:group-hover:scale-105"
            />
          </motion.div>
        </motion.div>
        {offer.insight && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium text-card-foreground shadow-lg shadow-foreground/10 sm:text-sm">
            {offer.priceHistory && offer.priceHistory.length >= 2 ? (
              <PriceTrend values={offer.priceHistory} className="shrink-0 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" aria-hidden />
            )}
            <span className="flex flex-col leading-tight">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-success">Histórico de preço</span>
              {offer.insight}
            </span>
          </div>
        )}
        {offer.discount && (
          <div
            aria-label={`${offer.discount}% de desconto`}
            className="pointer-events-none absolute right-3 top-3 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-discount text-discount-foreground shadow-lg shadow-discount/30 sm:h-24 sm:w-24"
          >
            <span className="text-2xl font-extrabold leading-none sm:text-3xl">-{offer.discount}%</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs">desconto</span>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: offer.storeColor }} />
          {offer.store}
        </p>
        <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-snug text-foreground sm:text-2xl">{offer.title}</h3>
        <p className="mt-4 flex flex-wrap items-baseline gap-x-3">
          <span className="text-5xl font-bold tabular-nums text-price sm:text-6xl">{formatCurrency(offer.price)}</span>
          {offer.originalPrice && (
            <span className="text-lg tabular-nums text-muted-foreground line-through">{formatCurrency(offer.originalPrice)}</span>
          )}
        </p>
        <span className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-lg bg-cta px-7 py-3 text-sm font-semibold text-cta-foreground transition-all duration-200 group-hover:bg-cta-hover group-hover:shadow-md">
          Ver oferta
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
