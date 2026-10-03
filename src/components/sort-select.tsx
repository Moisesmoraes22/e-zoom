"use client"

import type { SortOption } from "@/lib/types"

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "discount_desc", label: "Maior desconto" },
  { value: "rating_desc", label: "Melhor avaliação" },
  { value: "recent", label: "Mais recentes" },
]

export function SortSelect({
  value,
  onChange,
}: {
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
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
