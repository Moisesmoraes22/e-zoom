import { ArrowRight, Check, Clock, ExternalLink, Headphones, MousePointer2, Package, Search, ShoppingBag, Star, Tag, Truck } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

/*
 * The drawings are sized in `em`, and each panel sets 1em = 5% of its own width (container query units):
 * the whole picture scales with the card, from a phone to a wide screen, keeping its proportions.
 */

/** A bar standing for a line of text in the drawings. */
const Bar = ({ className = "" }: { className?: string }) => (
  <span className={`block h-[0.6em] rounded-full bg-slate-200 dark:bg-slate-600 ${className}`} />
)

/** Small yellow strokes around a drawing, like sparks. */
const Spark = ({ className = "" }: { className?: string }) => (
  <span className={`absolute block h-[0.38em] w-[1.1em] rounded-full bg-amber-400 ${className}`} />
)

const WINDOW =
  "absolute overflow-hidden rounded-[1em] bg-white shadow-xl shadow-blue-900/10 ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10"

/** Step 1: an offer card with its discount, rating and the "Ver na loja" button being clicked. */
function ChooseArt() {
  return (
    <div className="relative h-full w-full text-[5cqw]">
      <div className={`${WINDOW} inset-x-[1.2em] bottom-[1.2em] top-[1.7em] !overflow-visible`}>
        <span className="absolute -left-[0.7em] -top-[0.85em] -rotate-3 rounded-[0.5em] bg-amber-300 px-[0.6em] py-[0.2em] text-[1em] font-extrabold text-slate-900 shadow-md">
          -35%
        </span>
        <Headphones className="absolute left-[1em] top-[1em] h-[5.4em] w-[5.4em] text-hero" strokeWidth={1.6} aria-hidden />
        <div className="absolute right-[1.1em] top-[1.3em] w-[8.2em] space-y-[0.65em]">
          <Bar />
          <Bar className="w-4/5" />
          <span className="flex gap-[0.15em] pt-[0.2em]" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star
                key={i}
                className={`h-[0.95em] w-[0.95em] ${i < 4 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-600 dark:text-slate-600"}`}
              />
            ))}
          </span>
        </div>
        <span className="absolute bottom-[0.9em] right-[0.9em] inline-flex items-center gap-[0.4em] rounded-[0.5em] bg-hero px-[0.9em] py-[0.5em] text-[0.95em] font-bold text-white shadow-md shadow-hero/30">
          Ver na loja
          <ExternalLink className="h-[0.9em] w-[0.9em]" aria-hidden />
        </span>
      </div>
      <MousePointer2 className="absolute bottom-[0.1em] right-[0.5em] h-[2.3em] w-[2.3em] -rotate-12 fill-slate-900 text-white drop-shadow-md dark:fill-white dark:text-slate-900" aria-hidden />
      <Spark className="right-0 top-[3.4em] -rotate-45" />
      <Spark className="left-0 top-[6em] rotate-[20deg]" />
    </div>
  )
}

/** Step 2: the store page with price, shipping and delivery time to check. */
function CheckArt() {
  const rows = [
    { icon: Tag, label: "Preço" },
    { icon: Truck, label: "Frete" },
    { icon: Clock, label: "Prazo de entrega" },
  ]
  return (
    <div className="relative h-full w-full text-[5cqw]">
      <div className={`${WINDOW} inset-x-[1em] bottom-[1.1em] top-[1.5em]`}>
        <div className="flex h-[1.3em] items-center gap-[0.3em] bg-hero px-[0.8em]">
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-white/80" />
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-white/80" />
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-white/80" />
        </div>
        <div className="absolute left-[0.8em] top-[2.2em] flex h-[3.6em] w-[3.6em] items-center justify-center rounded-[0.8em] bg-blue-50 dark:bg-slate-700">
          <Headphones className="h-[2.2em] w-[2.2em] text-hero" strokeWidth={1.7} aria-hidden />
        </div>
        <div className="absolute left-[5em] top-[2.7em] w-[5.5em] space-y-[0.6em]">
          <Bar />
          <Bar className="w-2/3" />
        </div>
        <ul className="absolute bottom-[0.7em] right-[0.7em] w-[10.6em] space-y-[0.5em] rounded-[0.8em] bg-white p-[0.7em] shadow-lg ring-1 ring-black/5 dark:bg-slate-700 dark:ring-white/10">
          {rows.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-[0.5em] text-[0.8em] font-semibold leading-none text-slate-900 dark:text-white">
              <Icon className="h-[1.2em] w-[1.2em] shrink-0 text-hero" aria-hidden />
              <span className="min-w-0 flex-1 whitespace-nowrap">{label}</span>
              <span className="flex h-[1.2em] w-[1.2em] shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <Check className="h-[0.85em] w-[0.85em]" strokeWidth={3.4} aria-hidden />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Search className="absolute -top-[0.1em] right-[0.6em] h-[4em] w-[4em] text-hero drop-shadow-md" strokeWidth={2.4} aria-hidden />
      <Package className="absolute -bottom-[0.1em] left-[0.2em] h-[3.9em] w-[3.9em] fill-amber-200 text-amber-600 drop-shadow-md" strokeWidth={1.5} aria-hidden />
      <Spark className="left-0 top-[2.4em] -rotate-[25deg]" />
    </div>
  )
}

/** Step 3: the purchase completed on the page of the store itself. */
function FinishArt() {
  return (
    <div className="relative h-full w-full text-[5cqw]">
      <div className={`${WINDOW} inset-x-[1.2em] bottom-[1.3em] top-[1.4em]`}>
        <div className="flex h-[1.3em] items-center gap-[0.3em] bg-slate-100 px-[0.8em] dark:bg-slate-700">
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-slate-400" />
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-slate-400" />
          <span className="h-[0.38em] w-[0.38em] rounded-full bg-slate-400" />
        </div>
        <span className="absolute left-1/2 top-[2.1em] flex h-[3.6em] w-[3.6em] -translate-x-1/2 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30">
          <Check className="h-[2.2em] w-[2.2em] text-white" strokeWidth={3.2} aria-hidden />
        </span>
        <div className="absolute inset-x-[1.6em] bottom-[2.6em] space-y-[0.55em]">
          <Bar className="mx-auto w-3/5" />
          <Bar className="mx-auto w-2/5" />
        </div>
        <span className="absolute inset-x-[1.6em] bottom-[0.8em] block h-[1em] rounded-[0.35em] bg-hero" />
      </div>
      <ShoppingBag className="absolute -bottom-[0.1em] right-[0.2em] h-[4.4em] w-[4.4em] fill-hero text-white drop-shadow-lg" strokeWidth={1.5} aria-hidden />
      <Spark className="right-0 top-[0.5em] rotate-[60deg]" />
      <Spark className="right-[0.8em] top-[2.1em] -rotate-[35deg]" />
    </div>
  )
}

const STEPS: { title: string; text: string; art: ReactNode }[] = [
  { title: "Escolha a oferta", text: "Encontre o produto e clique para ver na loja.", art: <ChooseArt /> },
  { title: "Confira as condições na loja", text: "Verifique preço, frete e prazo de entrega.", art: <CheckArt /> },
  { title: "Finalize a compra por lá", text: "Conclua seu pedido no site da loja.", art: <FinishArt /> },
]

/** "Gostou de uma oferta? Veja como comprar." The site never sells: it points to the store. */
export function HowToBuy() {
  return (
    <section
      className="bg-gradient-to-b from-blue-50 to-slate-50 py-10 text-slate-900 dark:from-surface dark:to-surface dark:text-foreground sm:py-14"
      aria-labelledby="como-comprar"
    >
      <div className="page-container">
        <h2 id="como-comprar" className="text-2xl font-extrabold sm:text-3xl lg:text-4xl">
          Gostou de uma oferta? Veja como comprar.
        </h2>
        <ol className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col">
              <div
                aria-hidden
                className="relative aspect-[16/10] rounded-3xl bg-blue-100/60 [container-type:inline-size] dark:bg-slate-800/60"
              >
                {step.art}
              </div>
              {/* The dashed arrow that leads to the next step (side by side only). */}
              {i < STEPS.length - 1 && (
                <svg
                  aria-hidden
                  viewBox="0 0 48 16"
                  className="absolute -right-10 top-[26%] hidden h-4 w-9 text-hero sm:block lg:-right-12 lg:w-11 dark:text-brand"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 8h38" strokeDasharray="4 5" />
                  <path d="M38 2l7 6-7 6" />
                </svg>
              )}
              <div className="mt-5 flex items-start gap-4">
                <span
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hero text-xl font-extrabold text-white shadow-md shadow-hero/30"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-extrabold leading-snug sm:text-xl">{step.title}</h3>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-muted-foreground sm:text-base">{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-sm text-slate-600 dark:border-border dark:text-muted-foreground">
          <p>O E-Zooom reúne as ofertas. A loja é responsável pela venda e entrega.</p>
          <Link
            href="/como-funciona"
            className="-my-2.5 flex items-center gap-1 rounded-md py-2.5 font-semibold text-hero hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-brand"
          >
            Como selecionamos as ofertas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
