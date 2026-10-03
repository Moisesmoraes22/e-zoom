"use client"

import { Button } from "@/components/ui/button"
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
const RATINGS = [4, 4.5]

export function FilterPanel({
  filters,
  onChange,
  storeCounts,
  hideStoreFilter = false,
}: {
  filters: ProductFilters
  onChange: (patch: Partial<ProductFilters>) => void
  storeCounts: Partial<Record<StoreSource, number>>
  hideStoreFilter?: boolean
}) {
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

      {!hideStoreFilter && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-sm font-medium text-foreground">
            Loja
          </legend>
          {(Object.values(STORES) as typeof STORES.amazon[])
            .filter((store) => store.id !== "telegram")
            .map((store) => (
              <label
                key={store.id}
                className="flex cursor-pointer items-center justify-between text-sm text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.stores.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {store.name}
                </span>
                <span className="text-xs text-muted-foreground/70">
                  {storeCounts[store.id] ?? 0}
                </span>
              </label>
            ))}
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-medium text-foreground">
          Preço
        </legend>
        {PRICE_RANGES.map((range) => (
          <label
            key={range.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
          >
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
        <legend className="mb-1 text-sm font-medium text-foreground">
          Desconto
        </legend>
        <div className="flex flex-wrap gap-2">
          {DISCOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChange({
                  minDiscount: filters.minDiscount === value ? null : value,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors active:scale-95",
                filters.minDiscount === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {value}%+
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-foreground">
          Avaliação
        </legend>
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                onChange({
                  minRating: filters.minRating === value ? null : value,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors active:scale-95",
                filters.minRating === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {value}+
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={filters.freeShippingOnly}
          onChange={(event) =>
            onChange({ freeShippingOnly: event.target.checked })
          }
          className="h-4 w-4 rounded accent-primary"
        />
        Frete grátis
      </label>
    </div>
  )
}
