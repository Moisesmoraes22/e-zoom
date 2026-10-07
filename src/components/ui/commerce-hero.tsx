"use client";

import { Flame } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { ProductCard } from "@/components/product-card";
import { SearchBar } from "@/components/search-bar";
import type { CategoryCount } from "@/lib/deals";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

// Desktop-only and client-only: phones never download the lens or its cards.
const HeroLens = dynamic(() => import("@/components/ui/hero-lens").then((m) => m.HeroLens), { ssr: false });

/** From here the hero gets the dark panel with the magnifying glass; below it is text, search and the strip. */
const DESKTOP = "(min-width: 1024px)";

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
  showcase = [],
  lens = [],
  drops = 0,
  categories = [],
}: {
  storeNames: string[];
  /** Best-discount offers shown as a strip on the first screen (all sizes, keyboard friendly). */
  showcase?: Product[];
  /** Other offers that slide under the magnifying glass (desktop). Needs at least 4. */
  lens?: Product[];
  /** Price drops in the last 24h; the badge is hidden when zero. */
  drops?: number;
  /** Busiest categories, as quick links under the search. */
  categories?: CategoryCount[];
}) {
  const isDesktop = useIsDesktop();

  return (
    <div className="page-container relative">
      <section className="relative mt-3 rounded-3xl border border-border bg-gradient-to-br from-background via-accent/40 to-accent/70 sm:mt-4">
        <div className="relative">
          {isDesktop && lens.length >= 4 && (
            <div className="absolute inset-y-0 right-0 hidden w-[56%] overflow-hidden rounded-r-3xl bg-gradient-to-br from-[#1b3a85] to-band [clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)] lg:block">
              <HeroLens products={lens} />
            </div>
          )}

          <div className="relative z-10 flex items-center px-5 py-6 sm:px-10 sm:py-12 lg:min-h-[500px] lg:px-14 lg:py-10 pointer-events-none">
            <div className="pointer-events-auto w-full lg:max-w-[560px]">
              {drops > 0 && (
                <div className="mb-4 hidden items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-2.5 pr-3.5 text-[13px] font-semibold text-muted-foreground shadow-sm sm:inline-flex">
                  <span aria-hidden className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_rgb(34_160_80/0.2)]" />
                  <strong className="text-foreground">{drops}</strong>
                  {drops === 1 ? "preço caiu hoje" : "preços caíram hoje"}
                </div>
              )}
              <h1 className="mb-2 text-2xl font-extrabold leading-tight tracking-tight sm:mb-3 sm:text-4xl lg:text-[46px] lg:leading-[1.1]">
                <span className="text-foreground">Encontre </span>
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">ofertas</span>
                <span className="text-foreground"> que realmente valem a pena.</span>
              </h1>
              <p className="mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:mb-6 sm:text-lg">
                <span className="sm:hidden">Compare preços e ache o melhor preço.</span>
                <span className="hidden sm:inline">Compare preços e descubra onde comprar pelo melhor preço.</span>
              </p>

              <SearchBar className="max-w-xl" />

              {categories.length > 0 && (
                <div className="mt-4 hidden flex-wrap items-center gap-2 sm:flex">
                  <span className="text-[13px] text-muted-foreground">Populares:</span>
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/categoria/${c.slug}`}
                      prefetch={false}
                      className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}

              {storeNames.length > 0 && (
                <p className={cn("mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:mt-4 sm:text-sm")}>
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
          </div>
        </div>

        {showcase.length > 0 && <Showcase offers={showcase} />}
      </section>
    </div>
  );
}

/** Real offers with a recorded discount, visible on the first screen (also on phones). */
function Showcase({ offers }: { offers: Product[] }) {
  return (
    <div className="relative px-5 pb-6 sm:px-10 sm:pb-10">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-2xl">
          <Flame className="h-5 w-5 shrink-0 text-discount" aria-hidden />
          Maiores descontos agora
        </h2>
        <Link href="/busca?ordenacao=desconto" prefetch={false} className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground hover:underline">
          Ver todas
        </Link>
      </div>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:-mx-10 sm:px-10 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {offers.map((offer, i) => (
          <li key={offer.id} className="w-[46%] shrink-0 snap-start sm:w-[30%] lg:w-auto">
            <ProductCard product={offer} compact priority={i < 2} />
          </li>
        ))}
      </ul>
    </div>
  );
}
