"use client"

import { ListFilter, SearchX, SlidersHorizontal } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useMemo, useRef, useState } from "react"

import { AppliedFilterChips } from "@/components/applied-filter-chips"
import { FilterPanel } from "@/components/filter-panel"
import { Pagination } from "@/components/pagination"
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
  correctQuery,
  countByStore,
  EMPTY_FILTERS,
  isPriceRange,
  type PriceRange,
  filterProducts,
  SORT_PARAMS,
  sortProducts,
  type ProductFilters,
} from "@/lib/search"
import type { CategoryCount } from "@/lib/deals"
import { STORES } from "@/lib/mock-data"
import { SUPPLEMENT_TYPES, supplementTypeOf, type SupplementType } from "@/lib/supplement-types"
import type { Product, SortOption, StoreSource } from "@/lib/types"

const PAGE_SIZE = 24

interface SearchResultsProps {
  products: Product[]
  categories: CategoryCount[]
  categorySlug?: string
  categoryName?: string
}

/**
 * `?loja=` and `?preco=` (cards on the home page) preselect a store / price
 * range. Keyed by them, so following another link starts from its filters again.
 */
export function SearchResults(props: SearchResultsProps) {
  const params = useSearchParams()
  const loja = params.get("loja") ?? ""
  const preco = params.get("preco") ?? ""
  const initialStores = (Object.keys(STORES) as StoreSource[]).filter(
    (id) => id === loja && id !== "telegram",
  )
  const initialPriceRanges = isPriceRange(preco) ? [preco] : []
  return (
    <SearchResultsInner
      key={`${loja}|${preco}`}
      {...props}
      initialStores={initialStores}
      initialPriceRanges={initialPriceRanges}
    />
  )
}

function SearchResultsInner({
  products,
  categories,
  categorySlug,
  categoryName,
  initialStores,
  initialPriceRanges,
}: SearchResultsProps & {
  initialStores: StoreSource[]
  initialPriceRanges: PriceRange[]
}) {
  const searchParams = useSearchParams()
  const rawQuery = searchParams.get("q") ?? ""

  const [filters, setFilters] = useState<ProductFilters>({
    ...EMPTY_FILTERS,
    stores: initialStores,
    priceRanges: initialPriceRanges,
    category: categorySlug,
  })
  // ?ordenacao= sets the starting sort (menu links); picking one here overrides it
  // until the URL's value changes.
  const urlSort = SORT_PARAMS[searchParams.get("ordenacao") ?? ""] ?? "relevance"
  const [picked, setPicked] = useState<{ url: SortOption; value: SortOption } | null>(null)
  const sort = picked && picked.url === urlSort ? picked.value : urlSort
  const setSort = (value: SortOption) => setPicked({ url: urlSort, value })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)

  // On a category page the category is fixed; on /busca it is a regular filter.
  const handleFilterChange = (patch: Partial<ProductFilters>) =>
    setFilters((prev) => ({
      ...prev,
      ...patch,
      category: categorySlug ?? ("category" in patch ? patch.category : prev.category),
    }))
  const categoryFilter = categorySlug ? undefined : categories

  // Supplements only: quick chips by kind of product (whey, creatina, ...).
  const [kind, setKind] = useState<SupplementType | null>(null)
  const kindCounts = useMemo(() => {
    if (categorySlug !== "suplementos") return null
    const counts = new Map<SupplementType, number>()
    for (const p of products) {
      const t = p.category === categorySlug ? supplementTypeOf(p.title) : null
      if (t) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return counts
  }, [products, categorySlug])
  const baseProducts = useMemo(
    () => (kind ? products.filter((p) => supplementTypeOf(p.title) === kind) : products),
    [products, kind],
  )

  // A search with no match at all is retried with typos fixed ("wehy" -> "whey").
  const corrected = useMemo(() => {
    if (!rawQuery || filterProducts(baseProducts, { ...EMPTY_FILTERS, query: rawQuery }).length > 0) return null
    const fixed = correctQuery(rawQuery, baseProducts)
    // Only worth showing when the fixed words actually find something.
    return fixed && filterProducts(baseProducts, { ...EMPTY_FILTERS, query: fixed }).length > 0 ? fixed : null
  }, [rawQuery, baseProducts])
  const query = corrected ?? rawQuery

  const baseFilters: ProductFilters = { ...filters, query }

  const availableStores = useMemo(
    () => Object.keys(countByStore(products)) as StoreSource[],
    [products],
  )
  const storeCounts = useMemo(
    () => countByStore(filterProducts(baseProducts, { ...baseFilters, stores: [] })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseProducts, query, filters],
  )
  const results = useMemo(
    () => sortProducts(filterProducts(baseProducts, baseFilters), sort, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseProducts, query, filters, sort],
  )
  // Page resets to 1 whenever the query, filters or sort change (the key no longer matches).
  const pageKey = `${query}|${sort}|${kind}|${JSON.stringify(filters)}`
  const [pageState, setPageState] = useState({ page: 1, key: pageKey })
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const page = Math.min(pageState.key === pageKey ? pageState.page : 1, totalPages)
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const gridRef = useRef<HTMLDivElement>(null)
  const goToPage = (next: number) => {
    setPageState({ page: next, key: pageKey })
    gridRef.current?.scrollIntoView({ block: "start" })
  }
  const hasFilters =
    filters.stores.length > 0 ||
    filters.priceRanges.length > 0 ||
    filters.minDiscount !== null ||
    filters.freeShippingOnly ||
    (!categorySlug && !!filters.category)

  const title = rawQuery
    ? `Ofertas para "${rawQuery}"`
    : categoryName
      ? `Ofertas em ${categoryName}`
      : "Todas as ofertas"

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24 lg:pb-8">
      <div className="mb-6 lg:hidden">
        <SearchBar defaultValue={rawQuery} size="sm" />
      </div>

      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "oferta encontrada" : "ofertas encontradas"}
        {totalPages > 1 && ` · página ${page} de ${totalPages}`}
      </p>
      {corrected && (
        <p className="mt-1 text-sm text-foreground">
          Nada encontrado para “{rawQuery}”. Mostrando resultados para <strong>“{corrected}”</strong>.
        </p>
      )}

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-border bg-card p-5">
            <FilterPanel
              filters={filters}
              onChange={handleFilterChange}
              storeCounts={storeCounts}
              availableStores={availableStores}
              categories={categoryFilter}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 hidden items-center justify-between lg:flex">
            <AppliedFilterChips
              filters={filters}
              onChange={handleFilterChange}
              categories={categoryFilter}
            />
            <SortSelect value={sort} onChange={setSort} withUnitPrice={categorySlug === "suplementos"} />
          </div>

          <div className="mb-4 lg:hidden">
            <AppliedFilterChips
              filters={filters}
              onChange={handleFilterChange}
              categories={categoryFilter}
            />
          </div>

          {kindCounts && (
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Tipo de suplemento">
              {[{ value: null, label: "Todos" }, ...SUPPLEMENT_TYPES.filter((t) => kindCounts.get(t.value))].map((t) => (
                <button
                  key={t.value ?? "todos"}
                  type="button"
                  aria-pressed={kind === t.value}
                  onClick={() => setKind(t.value)}
                  className={`min-h-9 rounded-full border px-3.5 text-xs font-medium transition-colors ${
                    kind === t.value
                      ? "border-primary bg-primary/10 text-brand"
                      : "border-border text-foreground hover:bg-accent/40"
                  }`}
                >
                  {t.label}
                  {t.value && ` (${kindCounts.get(t.value)})`}
                </button>
              ))}
            </div>
          )}

          {results.length === 0 ? (
            <div
              role="status"
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center"
            >
              <SearchX className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-base font-medium text-foreground">
                Nenhuma oferta encontrada
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {hasFilters
                  ? "Nenhuma oferta combina com esses filtros."
                  : "Tente pesquisar por outro termo."}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFilterChange(EMPTY_FILTERS)}
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                ref={gridRef}
                className="grid scroll-mt-24 grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
              >
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
            </>
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
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filtrar
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2 active:scale-95"
          onClick={() => setSortOpen(true)}
        >
          <ListFilter className="h-4 w-4" aria-hidden />
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
            availableStores={availableStores}
            categories={categoryFilter}
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
                ["relevance", "Relevância"],
                ["discount_desc", "Maior desconto"],
                ["price_asc", "Menor preço"],
                ["recent", "Mais recentes"],
                ...(categorySlug === "suplementos" ? [["unit_price", "Melhor custo-benefício"]] : []),
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
                    ? "bg-primary/10 text-brand"
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
