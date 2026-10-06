"use client"

import type { SortOption } from "@/lib/types"

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevância" },
  { value: "discount_desc", label: "Maior desconto" },
  { value: "price_asc", label: "Menor preço" },
  { value: "recent", label: "Mais recentes" },
]

export function SortSelect({
  value,
  onChange,
  withUnitPrice = false,
}: {
  /** Supplements only: sort by price per kg. */
  withUnitPrice?: boolean
  value: SortOption
  onChange: (value: SortOption) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted-foreground sm:inline">
        Ordenar por
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {[...OPTIONS, ...(withUnitPrice ? [{ value: "unit_price" as SortOption, label: "Melhor custo-benefício" }] : [])].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
