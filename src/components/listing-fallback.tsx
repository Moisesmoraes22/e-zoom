import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

/**
 * What the static HTML of /busca and /categoria carries while the interactive list loads: the
 * title, the count and the first page of offers as real links. Search engines and slow phones
 * get content at once; the interactive list (filters, sort, pages) replaces it after hydration.
 */
export function ListingFallback({ title, total, cards }: { title: string; total: number; cards: Product[] }) {
  return (
    <div className="page-container py-8 pb-24 lg:pb-8">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} {total === 1 ? "oferta encontrada" : "ofertas encontradas"}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {cards.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
