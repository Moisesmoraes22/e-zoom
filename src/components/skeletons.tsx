// Placeholders shown by the routes' loading.tsx while the page streams in. They reuse the real
// grids and heights, so nothing jumps when the content arrives. The pulse is off for people who
// ask for less motion.
const block = "motion-safe:animate-pulse rounded-xl bg-muted"

export function CardSkeleton() {
  return <div aria-hidden className={`h-80 rounded-2xl motion-safe:animate-pulse bg-muted`} />
}

/** Title + count + grid of cards: category, search. */
export function ListingSkeleton({ cards = 10 }: { cards?: number }) {
  return (
    <div className="page-container py-8 pb-24 lg:pb-8" role="status" aria-label="Carregando ofertas">
      <div aria-hidden className={`${block} h-8 w-64 max-w-full`} />
      <div aria-hidden className={`${block} mt-2 h-4 w-40`} />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: cards }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/** Gallery on the left; title, price and the "go to offer" button on the right. */
export function ProductSkeleton() {
  return (
    <div className="page-container max-w-6xl py-6 sm:py-8" role="status" aria-label="Carregando oferta">
      <div aria-hidden className={`${block} mb-5 h-4 w-56`} />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-8">
        <div aria-hidden className={`${block} aspect-square w-full`} />
        <div className="space-y-4" aria-hidden>
          <div className={`${block} h-8 w-full`} />
          <div className={`${block} h-8 w-2/3`} />
          <div className={`${block} h-12 w-44`} />
          <div className={`${block} h-14 w-full`} />
          <div className={`${block} h-40 w-full`} />
        </div>
      </div>
    </div>
  )
}
