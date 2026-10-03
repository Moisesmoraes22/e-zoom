"use client"

import { ListFilter, SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useState } from "react"

import { AppliedFilterChips } from "@/components/applied-filter-chips"
import { FilterPanel } from "@/components/filter-panel"
import { ProductCard } from "@/components/product-card"
import { SearchBar } from "@/components/search-bar"
import { SortSelect } from "@/components/sort-select"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  countByStore,
  EMPTY_FILTERS,
  filterProducts,
  sortProducts,
  type ProductFilters,
} from "@/lib/search"
import type { Product, SortOption } from "@/lib/types"

export function SearchResults({
  products,
  categorySlug,
  categoryName,
}: {
  products: Product[]
  categorySlug?: string
  categoryName?: string
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  const [filters, setFilters] = useState<ProductFilters>({
    ...EMPTY_FILTERS,
    category: categorySlug,
  })
  const [sort, setSort] = useState<SortOption>("relevance")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  const handleFilterChange = (patch: Partial<ProductFilters>) =>
    setFilters((prev) => ({ ...prev, ...patch, category: categorySlug }))

  const baseFilters: ProductFilters = { ...filters, query }

  const storeCounts = useMemo(
    () =>
      countByStore(
        filterProducts(products, { ...baseFilters, stores: [] }),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, filters.category, filters.priceRanges, filters.minDiscount, filters.minRating, filters.freeShippingOnly],
  )

  const results = useMemo(
    () => sortProducts(filterProducts(products, baseFilters), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, filters, sort],
  )

  const title = query
    ? `Ofertas para "${query}"`
    : categoryName
      ? `Ofertas em ${categoryName}`
      : "Todas as ofertas"

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">
      <div className="mb-6 lg:hidden">
        <SearchBar defaultValue={query} size="sm" />
      </div>

      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
      </p>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-5">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              storeCounts={storeCounts}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <AppliedFilterChips
              filters={filters}
              onChange={handleFilterChange}
            />
            <SortSelect value={sort} onChange={setSort} />
          </div>

          <div className="mb-4 lg:hidden">
            <AppliedFilterChips
              filters={filters}
              onChange={handleFilterChange}
            />
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-base font-medium text-foreground">
                Nenhuma oferta encontrada
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Tente ajustar os filtros ou pesquisar por outro termo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky filter/sort bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-border bg-background p-3 lg:hidden">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2 active:scale-95"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2 active:scale-95"
          onClick={() => setSortOpen(true)}
        >
          <ListFilter className="h-4 w-4" />
          Ordenar
        </Button>
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[300px] overflow-y-auto p-6">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Filtrar ofertas</SheetTitle>
          </SheetHeader>
          <FilterPanel
            filters={filters}
            onChange={handleFilterChange}
            storeCounts={storeCounts}
          />
          <Button
            className="mt-6 w-full active:scale-95"
            onClick={() => setFiltersOpen(false)}
          >
            Ver {results.length}{" "}
            {results.length === 1 ? "oferta" : "ofertas"}
          </Button>
        </SheetContent>
      </Sheet>

      <Sheet open={sortOpen} onOpenChange={setSortOpen}>
        <SheetContent side="bottom" className="p-6">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Ordenar por</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1">
            {(
              [
                ["relevance", "Mais relevantes"],
                ["price_asc", "Menor preço"],
                ["discount_desc", "Maior desconto"],
                ["rating_desc", "Melhor avaliação"],
                ["recent", "Mais recentes"],
              ] as [SortOption, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSort(value)
                  setSortOpen(false)
                }}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors active:scale-[0.98] ${
                  sort === value
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-accent/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
