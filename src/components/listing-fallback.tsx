import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

/**
 * What the static HTML of /busca and /categoria carries while the interactive list loads: the
 * title, the count and the first page of offers as real links. Search engines and slow phones
 * get content at once; the interactive list (filters, sort, pages) replaces it after hydration.
 */
export function ListingFallback({
  title,
  total,
  cards,
  searching = false,
  loadingMore = false,
}: {
  title: string
  total: number
  cards: Product[]
  /** A search with no match yet: the full list may still find it (typos, synonyms), so no "0 offers" is shown. */
  searching?: boolean
  /** The interactive list (filters, sort, more pages) is still being fetched. */
  loadingMore?: boolean
}) {
  return (
    <div className="page-container py-8 pb-24 lg:pb-8" aria-busy={loadingMore}>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground" role="status">
        {searching ? (
          "Buscando ofertas…"
        ) : (
          <>
            {total} {total === 1 ? "oferta encontrada" : "ofertas encontradas"}
          </>
        )}
        {loadingMore && (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" aria-hidden />
            {searching ? "" : "carregando filtros e mais resultados…"}
          </span>
        )}
      </p>
      {searching ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted/50 motion-reduce:animate-none" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {cards.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
