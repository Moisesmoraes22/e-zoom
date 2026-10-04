"use client"

import { X } from "lucide-react"

import { STORES } from "@/lib/mock-data"
import type { CategoryCount } from "@/lib/deals"
import { EMPTY_FILTERS, type PriceRange, type ProductFilters } from "@/lib/search"
import type { StoreSource } from "@/lib/types"

const PRICE_LABELS: Record<PriceRange, string> = {
  "0-500": "Até R$ 500",
  "500-1000": "R$ 500 - R$ 1.000",
  "1000-2000": "R$ 1.000 - R$ 2.000",
  "2000+": "Acima de R$ 2.000",
}

export function AppliedFilterChips({
  filters,
  onChange,
  categories,
}: {
  filters: ProductFilters
  onChange: (patch: Partial<ProductFilters>) => void
  /** Pass to show the category chip (omit on a category page, where it is fixed). */
  categories?: CategoryCount[]
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = []

  const category = categories?.find((c) => c.slug === filters.category)
  if (category) {
    chips.push({
      key: "category",
      label: category.name,
      onRemove: () => onChange({ category: undefined }),
    })
  }

  filters.stores.forEach((store: StoreSource) => {
    chips.push({
      key: `store-${store}`,
      label: STORES[store].name,
      onRemove: () =>
        onChange({ stores: filters.stores.filter((s) => s !== store) }),
    })
  })

  filters.priceRanges.forEach((range) => {
    chips.push({
      key: `price-${range}`,
      label: PRICE_LABELS[range],
      onRemove: () =>
        onChange({
          priceRanges: filters.priceRanges.filter((r) => r !== range),
        }),
    })
  })

  if (filters.minDiscount) {
    chips.push({
      key: "discount",
      label: `${filters.minDiscount}%+ OFF`,
      onRemove: () => onChange({ minDiscount: null }),
    })
  }

  if (filters.freeShippingOnly) {
    chips.push({
      key: "shipping",
      label: "Frete grátis",
      onRemove: () => onChange({ freeShippingOnly: false }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={`Remover filtro ${chip.label}`}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-destructive/40 hover:text-destructive active:scale-95"
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(EMPTY_FILTERS)}
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-brand hover:underline"
      >
        Limpar tudo
      </button>
    </div>
  )
}
