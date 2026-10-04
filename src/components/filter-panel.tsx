"use client"

import { useId } from "react"

import { Button } from "@/components/ui/button"
import type { CategoryCount } from "@/lib/deals"
import { STORES } from "@/lib/mock-data"
import { EMPTY_FILTERS, type PriceRange, type ProductFilters } from "@/lib/search"
import type { StoreSource } from "@/lib/types"
import { cn } from "@/lib/utils"

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: "0-500", label: "Até R$ 500" },
  { value: "500-1000", label: "R$ 500 - R$ 1.000" },
  { value: "1000-2000", label: "R$ 1.000 - R$ 2.000" },
  { value: "2000+", label: "Acima de R$ 2.000" },
]

const DISCOUNTS = [10, 20, 30, 50]

const legend = "mb-1 text-sm font-medium text-foreground"
const option =
  "flex min-h-8 cursor-pointer items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"

export function FilterPanel({
  filters,
  onChange,
  storeCounts,
  availableStores,
  categories,
}: {
  filters: ProductFilters
  onChange: (patch: Partial<ProductFilters>) => void
  /** Matches per store under the other active filters. */
  storeCounts: Partial<Record<StoreSource, number>>
  /** Stores that have at least one offer in the catalog (others are not listed). */
  availableStores: StoreSource[]
  /** Pass to show the category filter (omit on a category page, where it is fixed). */
  categories?: CategoryCount[]
}) {
  // The desktop panel and the mobile sheet can both be mounted: keep their radio groups apart.
  const groupName = useId()
  const toggleStore = (store: StoreSource) => {
    const exists = filters.stores.includes(store)
    onChange({
      stores: exists
        ? filters.stores.filter((s) => s !== store)
        : [...filters.stores, store],
    })
  }

  const togglePriceRange = (range: PriceRange) => {
    const exists = filters.priceRanges.includes(range)
    onChange({
      priceRanges: exists
        ? filters.priceRanges.filter((r) => r !== range)
        : [...filters.priceRanges, range],
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs text-muted-foreground"
          onClick={() => onChange(EMPTY_FILTERS)}
        >
          Limpar filtros
        </Button>
      </div>

      {categories && categories.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className={legend}>Categoria</legend>
          <label className={option}>
            <input
              type="radio"
              name={groupName}
              checked={!filters.category}
              onChange={() => onChange({ category: undefined })}
              className="h-4 w-4 accent-primary"
            />
            Todas
          </label>
          {categories.map((category) => (
            <label key={category.slug} className={cn(option, "justify-between")}>
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name={groupName}
                  checked={filters.category === category.slug}
                  onChange={() => onChange({ category: category.slug })}
                  className="h-4 w-4 accent-primary"
                />
                {category.name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground/80">
                {category.count}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {availableStores.length > 0 && (
        <fieldset className="flex flex-col gap-1">
          <legend className={legend}>Loja</legend>
          {availableStores.map((id) => (
            <label key={id} className={cn(option, "justify-between")}>
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.stores.includes(id)}
                  onChange={() => toggleStore(id)}
                  className="h-4 w-4 rounded accent-primary"
                />
                {STORES[id].name}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground/80">
                {storeCounts[id] ?? 0}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-1">
        <legend className={legend}>Preço</legend>
        {PRICE_RANGES.map((range) => (
          <label key={range.value} className={option}>
            <input
              type="checkbox"
              checked={filters.priceRanges.includes(range.value)}
              onChange={() => togglePriceRange(range.value)}
              className="h-4 w-4 rounded accent-primary"
            />
            {range.label}
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className={legend}>Desconto</legend>
        <div className="flex flex-wrap gap-2">
          {DISCOUNTS.map((value) => {
            const selected = filters.minDiscount === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange({ minDiscount: selected ? null : value })}
                className={cn(
                  "min-h-8 cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {value}%+
              </button>
            )
          })}
        </div>
      </fieldset>

      <label className={option}>
        <input
          type="checkbox"
          checked={filters.freeShippingOnly}
          onChange={(event) => onChange({ freeShippingOnly: event.target.checked })}
          className="h-4 w-4 rounded accent-primary"
        />
        Frete grátis
      </label>
    </div>
  )
}
