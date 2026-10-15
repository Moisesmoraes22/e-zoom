import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { CheckArt, ChooseArt, FinishArt } from "@/components/how-to-buy-art"

const STEPS = [
  { title: "Escolha a oferta", text: "Encontre o produto e clique para ver na loja.", art: <ChooseArt /> },
  { title: "Confira as condições na loja", text: "Verifique preço, frete e prazo de entrega.", art: <CheckArt /> },
  { title: "Finalize a compra por lá", text: "Conclua seu pedido no site da loja.", art: <FinishArt /> },
]

/** "Gostou de uma oferta? Veja como comprar." The site never sells: it points to the store. */
export function HowToBuy() {
  return (
    <section
      className="bg-[#eff7fe] py-10 text-slate-900 dark:bg-surface dark:text-foreground sm:py-14"
      aria-labelledby="como-comprar"
    >
      <div className="page-container">
        <h2 id="como-comprar" className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
          Gostou de uma oferta? Veja como comprar.
        </h2>

        <ol className="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8 lg:gap-12">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col">
              {/* The drawings sit on the page's own light blue; in the dark theme they keep that panel. */}
              {/* The drawings are decorative (the text below says it all); in the dark theme they keep a light panel. */}
              <div className="aspect-[56/32] overflow-hidden rounded-3xl dark:bg-[#eff7fe]">{step.art}</div>

              {/* The dashed arrow that leads to the next step (side by side only). */}
              {i < STEPS.length - 1 && (
                <svg
                  aria-hidden
                  viewBox="0 0 48 16"
                  className="absolute -right-7 top-[22%] hidden h-4 w-6 text-hero sm:block lg:-right-10 lg:w-9 dark:text-brand"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
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
                <div className="min-w-0 pt-0.5">
                  <h3 className="text-xl font-extrabold leading-snug">{step.title}</h3>
                  <p className="mt-1 text-base text-slate-600 dark:text-muted-foreground">{step.text}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-9 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-slate-300/70 pt-5 text-sm text-slate-600 dark:border-border dark:text-muted-foreground">
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
