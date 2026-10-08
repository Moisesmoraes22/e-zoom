"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Cookie } from "lucide-react"
import Link from "next/link"
import Script from "next/script"
import { useEffect } from "react"

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

/** Asked once; "Preferências de cookies" in the footer brings it back. */
export function CookieBanner() {
  const consent = useAnalyticsConsent()

  return (
    <AnimatePresence>
      {consent === "unset" && (
        <motion.section
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-text"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.2, ease: "easeIn" } }}
          className="fixed inset-x-3 bottom-3 z-[90] rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl shadow-foreground/10 sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[22rem]"
        >
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-brand">
              <Cookie className="h-[18px] w-[18px]" />
            </span>
            <h2 id="cookie-title" className="text-base font-semibold leading-tight">
              Posso usar cookies?
            </h2>
          </div>

          <p id="cookie-text" className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            Com o Microsoft Clarity vemos onde as pessoas clicam e rolam, para melhorar o site. Se recusar, nada muda
            para você.{" "}
            <Link href="/privacidade" className="whitespace-nowrap font-medium text-brand underline-offset-2 hover:underline">
              Saiba mais
            </Link>
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="min-h-11 rounded-full" onClick={() => setAnalyticsConsent("no")}>
              Recusar
            </Button>
            <Button type="button" className="min-h-11 rounded-full" onClick={() => setAnalyticsConsent("yes")}>
              Aceitar
            </Button>
          </div>
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
