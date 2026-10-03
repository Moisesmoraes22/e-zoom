"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Heart, Sparkles, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

import { StoreBadge } from "@/components/store-badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useFavorites } from "@/lib/favorites-context"
import { cn, formatCurrency } from "@/lib/utils"

const ITEM_STAGGER = 0.07
const ITEM_SUCK_DURATION = 0.35

export function FavoritesSheet() {
  const { items, isOpen, setOpen, removeFavorite, clear, closeFavorites } =
    useFavorites()
  const [isClearing, setIsClearing] = useState(false)
  const clearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        className="flex w-[340px] flex-col gap-0 overflow-hidden p-0 sm:w-[420px]"
      >
        <SheetHeader className="border-b border-border/50 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-left">
          <SheetTitle className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <span>
              <span className="block text-base font-semibold text-foreground">
                Favoritos
              </span>
              <span className="block text-xs font-normal text-muted-foreground">
                {items.length > 0
                  ? `${items.length} ${items.length === 1 ? "produto salvo" : "produtos salvos"}`
                  : "Sua lista de desejos"}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <motion.span
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.15, 0.5] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-primary/20"
              />
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30"
              >
                <Heart className="h-9 w-9 text-primary-foreground" />
              </motion.span>
              <Sparkles className="absolute -right-1 -top-1 h-6 w-6 text-primary" />
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-base font-semibold text-foreground">
                Sua lista está vazia
              </p>
              <p className="max-w-[26ch] text-sm text-muted-foreground">
                Toque no coração de um produto para salvá-lo aqui e comparar
                preços antes de decidir.
              </p>
            </div>

            <Button
              type="button"
              onClick={closeFavorites}
              className="mt-2 gap-2 rounded-full px-6 shadow-md shadow-primary/20 active:scale-95"
            >
              Explorar produtos
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {items.map((item, index) => (
                    <motion.div
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
                        "group flex gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-2 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                        isClearing && "pointer-events-none",
                      )}
                    >
                      <a
                        href={item.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex flex-1 gap-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="flex flex-1 flex-col gap-1 py-0.5">
                          <StoreBadge store={item.store} className="w-fit" />
                          <p className="line-clamp-2 text-sm font-medium text-foreground">
                            {item.title}
                          </p>
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 self-start text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        onClick={() => removeFavorite(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border/50 p-6">
              <p className="text-xs text-muted-foreground">
                Cada produto é vendido e entregue pela loja de origem
                (Mercado Livre, Shopee ou Amazon). Toque em um item para
                finalizar a compra por lá.
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
                  <motion.span
                    animate={
                      isClearing
                        ? { rotate: [0, -12, 12, -12, 0] }
                        : { rotate: 0 }
                    }
                    transition={{
                      duration: 0.5,
                      repeat: isClearing ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.span>
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
