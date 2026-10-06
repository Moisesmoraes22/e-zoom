import { Boxes, Store, TrendingDown } from "lucide-react"

const nf = new Intl.NumberFormat("pt-BR")

/**
 * "What is happening now": real counts only, so the home reads as a monitor of the market.
 * The price-drop figure appears only when there is at least one drop in the window.
 */
export function StatsStrip({ offers, drops, stores }: { offers: number; drops: number; stores: number }) {
  const items = [
    { icon: Boxes, value: nf.format(offers), label: "ofertas monitoradas" },
    ...(drops > 0 ? [{ icon: TrendingDown, value: nf.format(drops), label: drops === 1 ? "preço caiu hoje" : "preços caíram hoje" }] : []),
    { icon: Store, value: String(stores), label: stores === 1 ? "loja monitorada" : "lojas monitoradas" },
  ]
  return (
    <section aria-label="Resumo do que está acontecendo agora" className="page-container pt-6">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
        {items.map(({ icon: Icon, value, label }) => (
          <li key={label} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-brand">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm text-muted-foreground">
              <strong className="mr-1.5 text-lg font-bold tabular-nums text-foreground">{value}</strong>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
