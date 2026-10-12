"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { ArrowRight, Check, X } from "lucide-react"
import { useEffect, useState } from "react"

import { categoryIcon } from "@/lib/category-icons"
import { ONBOARDED_KEY, savePicks, WELCOME_OPEN } from "@/lib/interest-profile"
import { cn } from "@/lib/utils"

const MAX_PICKS = 6
const BUDGETS = [
  { value: "100", label: "Até R$ 100" },
  { value: "300", label: "Até R$ 300" },
  { value: "1000", label: "Até R$ 1.000" },
  { value: "", label: "Sem limite" },
]

const mark = (value: string) => {
  try {
    localStorage.setItem(ONBOARDED_KEY, value)
  } catch {}
}

/**
 * First visit questions: what the person is looking for (categories) and how much they usually spend.
 * The answers only feed the profile kept in this browser, which adapts the home, the lists and the search.
 */
export function WelcomeDialog({ categories, delay }: { categories: { slug: string; name: string }[]; delay: number }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [picked, setPicked] = useState<string[]>([])
  const [budget, setBudget] = useState("300")

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), delay)
    const reopen = () => {
      setStep(0)
      setOpen(true)
    }
    window.addEventListener(WELCOME_OPEN, reopen)
    return () => {
      clearTimeout(id)
      window.removeEventListener(WELCOME_OPEN, reopen)
    }
  }, [delay])

  const toggle = (slug: string) =>
    setPicked((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : p.length >= MAX_PICKS ? p : [...p, slug]))

  const finish = () => {
    savePicks(picked, budget)
    mark("done")
    setOpen(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          try {
            // Closing without answering counts as "not now"; an earlier answer is kept.
            if (!localStorage.getItem(ONBOARDED_KEY)) mark("skip")
          } catch {}
        }
        setOpen(next)
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-200 data-[state=closed]:duration-150" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl bg-background shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:duration-200 data-[state=closed]:duration-150 motion-reduce:duration-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Passo {step + 1} de 2</p>
              <Dialog.Title className="mt-1 text-xl font-extrabold sm:text-2xl">
                {step === 0 ? "O que você procura?" : "Quanto costuma gastar?"}
              </Dialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === 0
                  ? `Marque até ${MAX_PICKS} categorias e montamos o site para você.`
                  : "Mostramos primeiro as ofertas que cabem no seu bolso."}
              </p>
            </div>
            <Dialog.Close className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Agora não</span>
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
            {step === 0 ? (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {categories.map((c) => {
                  const Icon = categoryIcon(c.slug)
                  const on = picked.includes(c.slug)
                  return (
                    <li key={c.slug}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(c.slug)}
                        className={cn(
                          "relative flex min-h-[72px] w-full flex-col items-start justify-center gap-1 rounded-2xl border-2 px-3 py-2.5 text-left text-sm font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on ? "border-hero bg-hero/10 text-foreground" : "border-border hover:bg-accent/40",
                        )}
                      >
                        <Icon className={cn("h-5 w-5", on ? "text-hero dark:text-brand" : "text-muted-foreground")} aria-hidden />
                        <span>{c.name}</span>
                        {on && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-hero dark:text-brand" aria-hidden />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <ul className="grid gap-2.5" role="radiogroup" aria-label="Quanto costuma gastar">
                {BUDGETS.map((b) => (
                  <li key={b.value || "none"}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={budget === b.value}
                      onClick={() => setBudget(b.value)}
                      className={cn(
                        "flex min-h-12 w-full items-center justify-between rounded-2xl border-2 px-4 text-left text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        budget === b.value ? "border-hero bg-hero/10" : "border-border hover:bg-accent/40",
                      )}
                    >
                      {b.label}
                      {budget === b.value && <Check className="h-5 w-5 text-hero dark:text-brand" aria-hidden />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-xs text-muted-foreground">Suas respostas ficam só neste aparelho.</p>
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Voltar
                </button>
              )}
              <button
                type="button"
                disabled={step === 0 && picked.length === 0}
                onClick={() => (step === 0 ? setStep(1) : finish())}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-hero px-6 text-sm font-bold text-hero-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 sm:flex-none"
              >
                {step === 0 ? "Continuar" : "Ver minhas ofertas"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
