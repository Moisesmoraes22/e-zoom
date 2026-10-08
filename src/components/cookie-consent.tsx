"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check, Cookie } from "lucide-react"
import Link from "next/link"
import Script from "next/script"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { setAnalyticsConsent, useAnalyticsConsent } from "@/lib/analytics-consent"

const CLARITY_ID = "ytokdbgssy"

/**
 * Microsoft Clarity records how pages are used (clicks, scrolling) and sets cookies, so it loads ONLY
 * after the visitor accepts. Taking the choice back erases its cookies and reloads the page without it.
 */
export function ClarityLoader() {
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if ((consent === "no" || consent === "unset") && document.getElementById("clarity")) {
      // It was loaded earlier in this visit and the choice was taken back: the tag cannot be unloaded,
      // so erase its cookies and reload the page without it.
      for (const name of ["_clck", "_clsk", "CLID", "ANONCHK", "MR", "MUID", "SM"]) {
        document.cookie = `${name}=; Max-Age=0; path=/`
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${location.hostname}`
      }
      location.reload()
    }
  }, [consent])

  if (consent !== "yes") return null
  return (
    <Script id="clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  )
}

/** The card pops in, its parts follow one after the other; a choice gets a short answer before it leaves. */
const card = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 28, staggerChildren: 0.07, delayChildren: 0.12 },
  },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.22, ease: "easeIn" as const } },
}
const part = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" as const } },
}

/** Asked once; "Preferências de cookies" in the footer brings it back. */
export function CookieBanner() {
  const consent = useAnalyticsConsent()
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null)

  // Shows "Obrigado" for a moment, then stores the choice (which makes the card leave).
  const choose = (value: "yes" | "no") => {
    if (answer) return
    setAnswer(value)
    setTimeout(() => {
      setAnalyticsConsent(value)
      setAnswer(null)
    }, 700)
  }

  return (
    <AnimatePresence>
      {consent === "unset" && (
        <motion.section
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-text"
          variants={card}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-x-3 bottom-3 z-[90] overflow-hidden rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl shadow-foreground/10 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[22rem]"
        >
          <motion.div variants={part} className="flex items-center gap-2.5">
            <span aria-hidden className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-brand">
              <AnimatePresence mode="wait" initial={false}>
                {answer ? (
                  <motion.span
                    key="done"
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  >
                    <Check className="h-[18px] w-[18px]" strokeWidth={3} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="cookie"
                    animate={{ rotate: [0, -14, 12, -8, 0] }}
                    transition={{ duration: 0.9, delay: 0.6, repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
                  >
                    <Cookie className="h-[18px] w-[18px]" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <h2 id="cookie-title" aria-live="polite" className="text-base font-semibold leading-tight">
              {answer === "yes" ? "Obrigado!" : answer === "no" ? "Tudo bem, sem cookies." : "Posso usar cookies?"}
            </h2>
          </motion.div>

          <motion.p variants={part} id="cookie-text" className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Com o Microsoft Clarity vemos onde as pessoas clicam e rolam, para melhorar o site. Se recusar, nada muda
            para você.{" "}
            <Link href="/privacidade" className="whitespace-nowrap font-medium text-brand underline-offset-2 hover:underline">
              Saiba mais
            </Link>
          </motion.p>

          <motion.div variants={part} className="mt-4 grid grid-cols-2 gap-2">
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
              <Button type="button" variant="outline" disabled={answer !== null} className="min-h-11 w-full rounded-full" onClick={() => choose("no")}>
                Recusar
              </Button>
            </motion.div>
            <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}>
              <Button type="button" disabled={answer !== null} className="min-h-11 w-full rounded-full" onClick={() => choose("yes")}>
                Aceitar
              </Button>
            </motion.div>
          </motion.div>

          {/* A thin bar that fills while the answer is shown, so the pause reads as intentional. */}
          {answer && (
            <motion.span
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.7, ease: "linear" }}
            />
          )}
        </motion.section>
      )}
    </AnimatePresence>
  )
}

/** Footer link: forget the choice so the notice asks again. */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => setAnalyticsConsent(null)} className={className}>
      Preferências de cookies
    </button>
  )
}
