"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
  Cloud,
  ExternalLink,
  Heart,
  Loader2,
  TrendingDown,
  TrendingUp,
  Trash2,
  TriangleAlert,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { OfferLink } from "@/components/offer-link"
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
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const catalog = useSearchIndex()

  // Current prices come from the live catalog, so we can tell what changed
  // since the item was saved (the saved copy keeps the price at that moment).
  useEffect(() => {
    if (isOpen) loadSearchIndex()
  }, [isOpen])
  const current = new Map(catalog.items.map((item) => [item.id, item.price]))

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
              <Heart className="h-5 w-5 fill-current" />
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
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span
              aria-hidden
              className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-brand"
            >
              <Heart className="h-9 w-9" />
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
                        "flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3",
                        isClearing && "pointer-events-none",
                      )}
                    >
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
                            <p className="text-base font-bold tabular-nums text-brand">
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
                        <div className="mt-1 flex items-center gap-2">
                          {!gone && (
                            <OfferLink
                              product={item}
                              store={item.store}
                              affiliateUrl={item.affiliateUrl}
                              className="flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                variant="outline"
                disabled={isClearing}
                className="relative w-full overflow-hidden active:scale-[0.98] disabled:opacity-100"
                onClick={handleClear}
              >
                {isClearing && (
                  <motion.span
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration:
                        (items.length - 1) * ITEM_STAGGER +
                        ITEM_SUCK_DURATION +
                        0.08,
                      ease: "linear",
                    }}
                    className="absolute inset-y-0 left-0 bg-destructive/15"
                  />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {isClearing ? "Limpando..." : "Limpar favoritos"}
                </span>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
