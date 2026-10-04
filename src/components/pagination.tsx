"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

/** 1 … 4 5 6 … 12: first, last, and the neighbours of the current page. */
export function pageList(page: number, total: number): (number | "gap")[] {
  const wanted = new Set([1, total, page - 1, page, page + 1])
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? ["gap" as const, p] : [p]))
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const base =
    "inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors active:scale-95 disabled:pointer-events-none disabled:opacity-40"

  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        className={cn(base, "gap-1 hover:bg-accent/40")}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Anterior</span>
        <span className="sr-only sm:hidden">Página anterior</span>
      </button>

      {pageList(page, totalPages).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Página ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              base,
              p === page
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent/40",
            )}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className={cn(base, "gap-1 hover:bg-accent/40")}
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <span className="hidden sm:inline">Próxima</span>
        <span className="sr-only sm:hidden">Próxima página</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  )
}
