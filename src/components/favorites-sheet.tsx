"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  Cloud,
  ExternalLink,
  Bookmark,
  Loader2,
  TrendingDown,
  TrendingUp,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { OfferLink, recordOfferClick } from "@/components/offer-link"
import { StoreBadge } from "@/components/store-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useFavorites } from "@/lib/favorites-context"
import { loadSearchIndex, useSearchIndex } from "@/lib/search-index"
import { cn, formatCurrency } from "@/lib/utils"

const ITEM_STAGGER = 0.07
const ITEM_SUCK_DURATION = 0.35

export function FavoritesSheet() {
  const {
    items,
    isOpen,
    setOpen,
    removeFavorite,
    clear,
    closeFavorites,
    signedIn,
    syncState,
    retrySync,
  } = useFavorites()
  const [isClearing, setIsClearing] = useState(false)
  const [blockedTabs, setBlockedTabs] = useState(0)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const catalog = useSearchIndex()

  // Current prices come from the live catalog, so we can tell what changed
  // since the item was saved (the saved copy keeps the price at that moment).
  useEffect(() => {
    if (isOpen) loadSearchIndex()
  }, [isOpen])
  const current = new Map(catalog.items.map((item) => [item.id, item.price]))

  // Opens every saved offer that is still in the catalog, one tab each (the browser may block extra tabs).
  const handleOpenAll = () => {
    const live = items.filter((item) => !(catalog.status === "ready" && !current.has(item.id)))
    let blocked = 0
    for (const item of live) {
      recordOfferClick(item)
      if (!window.open(item.affiliateUrl, "_blank", "noopener,noreferrer")) blocked++
    }
    setBlockedTabs(blocked)
  }

  const handleClear = () => {
    if (isClearing || items.length === 0) return
    setIsClearing(true)
    const totalDuration =
      (items.length - 1) * ITEM_STAGGER * 1000 + ITEM_SUCK_DURATION * 1000
    clearTimeoutRef.current = setTimeout(() => {
      clear()
      setIsClearing(false)
    }, totalDuration + 80)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && clearTimeoutRef.current) {
          clearTimeout(clearTimeoutRef.current)
          setIsClearing(false)
        }
        setOpen(open)
      }}
    >
      <SheetContent
        side="right"
        className="flex w-[360px] max-w-full flex-col gap-0 overflow-hidden p-0 sm:w-[420px]"
      >
        <SheetHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 pr-14 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Bookmark className="h-5 w-5 fill-current" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">
                Favoritos
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {items.length > 0
                  ? `${items.length} ${items.length === 1 ? "oferta salva" : "ofertas salvas"}`
                  : "Sua lista de desejos"}
              </span>
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            Produtos que você salvou neste dispositivo.
          </SheetDescription>
          {items.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isClearing}
              onClick={handleClear}
              className="absolute right-12 top-4 h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive disabled:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {isClearing ? "Limpando…" : "Limpar"}
            </Button>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-brand"
            >
              <Bookmark className="h-9 w-9" />
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-foreground">
                Você ainda não salvou nada
              </p>
              <p className="max-w-[28ch] text-sm text-muted-foreground">
                Toque no coração de uma oferta para guardá-la aqui e voltar
                depois para ver se o preço mudou.
              </p>
            </div>
            <Button asChild className="mt-1 rounded-full px-6">
              <Link href="/busca?ordenacao=desconto" onClick={closeFavorites}>
                Ver ofertas com desconto
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <AnimatePresence initial={false}>
                {items.map((item, index) => {
                  const now = current.get(item.id)
                  const gone = catalog.status === "ready" && now === undefined
                  const delta = now === undefined ? 0 : now - item.price
                  return (
                    <motion.li
                      key={item.id}
                      layout={!isClearing}
                      initial={{ opacity: 0, x: 24, height: 0 }}
                      animate={
                        isClearing
                          ? {
                              opacity: 0,
                              scale: 0.15,
                              y: 90,
                              rotate: -12,
                              height: "auto",
                              transition: {
                                duration: ITEM_SUCK_DURATION,
                                delay: index * ITEM_STAGGER,
                                ease: "easeIn",
                              },
                            }
                          : { opacity: 1, x: 0, height: "auto" }
                      }
                      exit={{ opacity: 0, x: 24, height: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={cn(
                        "flex shrink-0 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3",
                        isClearing && "pointer-events-none",
                      )}
                    >
                      <div className="flex gap-3">
                      <Link
                        href={`/produto/${item.id}`}
                        onClick={closeFavorites}
                        aria-label={`Ver detalhes: ${item.title}`}
                        className="shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt=""
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <StoreBadge store={item.store} variant="minimal" />
                        <Link
                          href={`/produto/${item.id}`}
                          onClick={closeFavorites}
                          className="line-clamp-2 text-sm font-medium text-foreground hover:underline"
                        >
                          {item.title}
                        </Link>
                        {gone ? (
                          <p className="text-xs text-muted-foreground">
                            Esta oferta não está mais disponível no E-Zoom.
                          </p>
                        ) : (
                          <>
                            <p className="text-base font-bold tabular-nums text-price">
                              {formatCurrency(now ?? item.price)}
                            </p>
                            {delta < -0.005 && (
                              <p className="flex items-center gap-1 text-xs font-medium text-brand">
                                <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                                Caiu {formatCurrency(-delta)} desde que você salvou
                              </p>
                            )}
                            {delta > 0.005 && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                                Subiu {formatCurrency(delta)} desde que você salvou
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!gone && (
                          <OfferLink
                            product={item}
                            store={item.store}
                            affiliateUrl={item.affiliateUrl}
                            className="flex min-h-9 items-center gap-1.5 rounded-full bg-cta px-3.5 text-xs font-semibold text-cta-foreground transition-colors hover:bg-cta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            Ver oferta
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </OfferLink>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${item.title} dos favoritos`}
                          className="ml-auto h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFavorite(item.id)}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>

            <div className="flex flex-col gap-3 border-t border-border p-5">
              {signedIn ? (
                syncState === "error" ? (
                  <div
                    role="alert"
                    className="flex flex-col items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
                  >
                    <p className="flex items-start gap-1.5 font-medium">
                      <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                      Não conseguimos sincronizar seus favoritos agora. Eles continuam
                      salvos neste dispositivo.
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={retrySync} className="h-8 bg-background text-foreground">
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <p role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {syncState === "synced" ? (
                      <>
                        <Cloud className="h-3.5 w-3.5 text-brand" aria-hidden />
                        Seus favoritos estão sincronizados.
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        Sincronizando seus favoritos…
                      </>
                    )}
                  </p>
                )
              ) : (
                <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  <p>Seus favoritos ficam salvos neste dispositivo.</p>
                  <p className="mt-1.5">
                    <span className="font-medium text-foreground">
                      Quer acessar seus favoritos em outros dispositivos?
                    </span>{" "}
                    <Link href="/login" onClick={closeFavorites} className="font-semibold text-brand hover:underline">
                      Entre
                    </Link>{" "}
                    ou{" "}
                    <Link href="/cadastro" onClick={closeFavorites} className="font-semibold text-brand hover:underline">
                      crie uma conta
                    </Link>{" "}
                    para sincronizar.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Cada produto é vendido e entregue pela loja de origem; ao tocar
                em “Ver oferta” você vai finalizar a compra por lá.
              </p>
              <Button
                type="button"
                disabled={isClearing}
                onClick={handleOpenAll}
                className="w-full gap-2 bg-cta text-cta-foreground hover:bg-cta-hover active:scale-[0.98]"
              >
                Ver ofertas
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Button>
              {blockedTabs > 0 && (
                <p role="status" className="text-xs text-muted-foreground">
                  O navegador bloqueou {blockedTabs} {blockedTabs === 1 ? "aba" : "abas"}. Permita pop-ups
                  para o E-Zoom e toque de novo, ou use o “Ver oferta” de cada item.
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
