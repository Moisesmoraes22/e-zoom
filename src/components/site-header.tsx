"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Clock,
  Flame,
  Heart,
  Menu as MenuIcon,
  Search,
  Tag,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";

import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, MenuLink } from "@/components/ui/navbar-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { categoryIcon } from "@/lib/category-icons";
import type { CategoryCount } from "@/lib/deals";
import { useFavorites } from "@/lib/favorites-context";
import { cn } from "@/lib/utils";

/**
 * "Ofertas" entries are sorted views of /busca (`?ordenacao=`). Each one can
 * become its own page later without changing the menu.
 */
const OFFER_VIEWS: { label: string; href: string; icon: LucideIcon; hint: string }[] = [
  { label: "Melhores ofertas", href: "/busca?ordenacao=relevancia", icon: Flame, hint: "Com desconto real primeiro" },
  { label: "Maiores descontos", href: "/busca?ordenacao=desconto", icon: TrendingDown, hint: "Ordenadas pelo desconto" },
  { label: "Menor preço", href: "/busca?ordenacao=preco", icon: Tag, hint: "Do mais barato ao mais caro" },
  { label: "Ofertas recentes", href: "/busca?ordenacao=recente", icon: Clock, hint: "Adicionadas há pouco" },
];

export function SiteHeader({
  categories,
  showCounts,
}: {
  categories: CategoryCount[];
  /** Counts are only real when the catalog comes from the database. */
  showCounts: boolean;
}) {
  const { count, openFavorites, favoritesIconRef, bumpSignal } = useFavorites();
  const favoritesControls = useAnimationControls();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (bumpSignal === 0) return;
    favoritesControls.start({
      scale: [1, 1.25, 0.95, 1.08, 1],
      transition: { duration: 0.5, ease: "easeOut" },
    });
  }, [bumpSignal, favoritesControls]);

  const homeActive = pathname === "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-semibold text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          HibridLink
        </Link>

        <div className="ml-6 hidden items-center gap-7 lg:flex">
          <Link
            href="/"
            aria-current={homeActive ? "page" : undefined}
            className={cn(
              "rounded-md text-sm font-semibold transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              homeActive ? "text-brand" : "text-foreground",
            )}
          >
            Início
          </Link>
          <Menu active={activeMenu} setActive={setActiveMenu}>
            <MenuItem setActive={setActiveMenu} active={activeMenu} item="Categorias">
              <div className="grid w-[26rem] grid-cols-2 gap-1">
                {categories.map((category) => {
                  const Icon = categoryIcon(category.slug);
                  return (
                    <MenuLink key={category.slug} href={`/categoria/${category.slug}`}>
                      <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span className="flex flex-col leading-tight">
                        {category.name}
                        {showCounts && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {category.count} {category.count === 1 ? "oferta" : "ofertas"}
                          </span>
                        )}
                      </span>
                    </MenuLink>
                  );
                })}
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <MenuLink href="/busca" className="text-brand">
                  Ver todas as categorias
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </MenuLink>
              </div>
            </MenuItem>
            <MenuItem setActive={setActiveMenu} active={activeMenu} item="Ofertas">
              <div className="grid w-72 gap-1">
                {OFFER_VIEWS.map(({ label, href, icon: Icon, hint }) => (
                  <MenuLink key={label} href={href}>
                    <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    <span className="flex flex-col leading-tight">
                      {label}
                      <span className="text-xs font-normal text-muted-foreground">{hint}</span>
                    </span>
                  </MenuLink>
                ))}
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <MenuLink href="/busca" className="text-brand">
                  Ver todas as ofertas
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </MenuLink>
              </div>
            </MenuItem>
          </Menu>
          <Link
            href="/#sobre"
            className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sobre
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/busca"
            aria-label="Buscar ofertas"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Link>

          <ThemeToggle className="hidden lg:inline-flex" />

          <motion.button
            ref={favoritesIconRef}
            type="button"
            onClick={openFavorites}
            aria-label={`Abrir favoritos${count > 0 ? ` (${count} ${count === 1 ? "item" : "itens"})` : ""}`}
            animate={favoritesControls}
            whileTap={{ scale: 0.9 }}
            className="relative flex h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-primary/40 bg-primary/10 px-3 text-brand transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Heart className="h-5 w-5" aria-hidden />
            <span className="hidden text-sm font-semibold sm:inline">Favoritos</span>
            <AnimatePresence mode="popLayout" initial={false}>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.3, opacity: 0, y: -6 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground shadow-md ring-2 ring-background"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir menu"
                className="h-11 w-11 transition-colors hover:text-brand"
              >
                <MenuIcon className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[300px] flex-col gap-0 overflow-y-auto border-r border-border p-0 sm:w-[360px]"
            >
              <SheetHeader className="border-b border-border p-5 text-left">
                <SheetTitle className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-xl font-semibold text-transparent">
                  HibridLink
                </SheetTitle>
              </SheetHeader>
              <div className="p-5 pb-0">
                <SearchBar size="sm" />
              </div>
              <nav
                aria-label="Menu"
                className="flex flex-col gap-5 p-5"
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
                }}
              >
                <MenuLink href="/" className="-mx-3 h-12 text-base">
                  Início
                </MenuLink>

                <section aria-labelledby="m-cat">
                  <h2 id="m-cat" className="mb-1 px-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Categorias
                  </h2>
                  <div className="-mx-3 grid grid-cols-2 gap-1">
                    {categories.map((category) => {
                      const Icon = categoryIcon(category.slug);
                      return (
                        <MenuLink
                          key={category.slug}
                          href={`/categoria/${category.slug}`}
                          className="min-h-11 gap-2 px-3"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                          <span className="leading-tight">{category.name}</span>
                        </MenuLink>
                      );
                    })}
                  </div>
                </section>

                <section aria-labelledby="m-off">
                  <h2 id="m-off" className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ofertas
                  </h2>
                  <div className="-mx-3 flex flex-col gap-1">
                    {OFFER_VIEWS.map(({ label, href, icon: Icon }) => (
                      <MenuLink key={label} href={href} className="min-h-11">
                        <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                        {label}
                      </MenuLink>
                    ))}
                  </div>
                </section>

                <MenuLink href="/#sobre" className="-mx-3 min-h-11 text-muted-foreground">
                  Sobre
                </MenuLink>
              </nav>
              <div className="mt-auto border-t border-border p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Aparência
                </p>
                <ThemeToggle showLabels className="flex w-full" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
