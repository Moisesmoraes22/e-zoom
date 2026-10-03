"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Menu as MenuIcon, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  HoveredLink,
  Menu,
  MenuItem,
  ProductItem,
} from "@/components/ui/navbar-menu";
import { SearchBar } from "@/components/search-bar";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useFavorites } from "@/lib/favorites-context";
import { CATEGORIES, DEALS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const navigation = [
  { name: "Início", href: "/" },
  { name: "Categorias", href: "/busca" },
  { name: "Ofertas", href: "/busca" },
  { name: "Sobre", href: "#" },
];

export function SiteHeader() {
  const { count, openFavorites, favoritesIconRef, bumpSignal } =
    useFavorites();
  const favoritesControls = useAnimationControls();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (bumpSignal === 0) return;
    favoritesControls.start({
      scale: [1, 1.25, 0.95, 1.08, 1],
      transition: { duration: 0.5, ease: "easeOut" },
    });
  }, [bumpSignal, favoritesControls]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Link
          href="/"
          className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
        >
          HibridLink
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            Início
          </Link>
          <Menu setActive={setActiveMenu}>
            <MenuItem
              setActive={setActiveMenu}
              active={activeMenu}
              item="Categorias"
            >
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {CATEGORIES.map((category) => (
                  <HoveredLink
                    key={category.slug}
                    href={`/categoria/${category.slug}`}
                  >
                    {category.name}
                  </HoveredLink>
                ))}
              </div>
            </MenuItem>
            <MenuItem
              setActive={setActiveMenu}
              active={activeMenu}
              item="Ofertas"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                {DEALS.slice(0, 4).map((deal) => (
                  <ProductItem
                    key={deal.id}
                    title={deal.title}
                    href={`/produto/${deal.id}`}
                    src={deal.image}
                    description={formatCurrency(deal.price)}
                  />
                ))}
              </div>
            </MenuItem>
            <MenuItem
              setActive={setActiveMenu}
              active={activeMenu}
              item="Sobre"
            >
              <div className="flex flex-col space-y-3 text-sm">
                <HoveredLink href="#">Como funciona</HoveredLink>
                <HoveredLink href="#">Perguntas frequentes</HoveredLink>
                <HoveredLink href="#">Lojas parceiras</HoveredLink>
                <HoveredLink href="#">Contato</HoveredLink>
              </div>
            </MenuItem>
          </Menu>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/busca"
            className="hidden lg:flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-foreground transition-colors hover:text-primary active:scale-90"
          >
            <Search className="w-5 h-5" />
          </Link>

          <motion.button
            ref={favoritesIconRef}
            type="button"
            onClick={openFavorites}
            aria-label={`Abrir favoritos${count > 0 ? ` (${count} ${count === 1 ? "item" : "itens"})` : ""}`}
            animate={favoritesControls}
            whileTap={{ scale: 0.9 }}
            className="relative flex cursor-pointer items-center gap-2 rounded-full border-2 border-primary/40 bg-primary/10 px-3 py-2 text-primary shadow-sm transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Heart className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-semibold">
              Favoritos
            </span>
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

          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-primary transition-colors active:scale-90"
              >
                <MenuIcon className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[400px] p-0 bg-background/95 backdrop-blur-md border-r border-border/50"
            >
              <SheetHeader className="p-6 text-left border-b border-border/50">
                <SheetTitle className="flex items-center justify-between">
                  <Link
                    href="/"
                    className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                  >
                    HibridLink
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-6 space-y-1">
                {navigation.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="justify-start px-2 h-12 text-base font-medium hover:bg-accent/50 hover:text-primary transition-colors active:scale-[0.98]"
                    asChild
                  >
                    <Link href={item.href}>{item.name}</Link>
                  </Button>
                ))}
              </nav>
              <Separator className="mx-6" />
              <div className="p-6 flex flex-col gap-4">
                <SearchBar size="sm" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
