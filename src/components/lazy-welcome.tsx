"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useSyncExternalStore } from "react"

import { useAnalyticsConsent } from "@/lib/analytics-consent"
import { INTERESTS_KEY, ONBOARDED_KEY, WELCOME_OPEN } from "@/lib/interest-profile"

// The questions are only needed on a first visit (or when asked for again), so their code is not in the
// first JavaScript: it is fetched only when one of those happens.
const WelcomeDialog = dynamic(() => import("@/components/welcome-dialog").then((m) => m.WelcomeDialog), { ssr: false })

const BOT = /bot|crawl|spider|slurp|lighthouse|headless|prerender/i

/** A first visit by a person: no answer yet, no history, not a crawler or an automated browser. */
function isFirstVisit() {
  try {
    if (BOT.test(navigator.userAgent) || navigator.webdriver) return false
    if (localStorage.getItem(ONBOARDED_KEY)) return false
    // Someone who already has a history on this device is not asked.
    const history = JSON.parse(localStorage.getItem(INTERESTS_KEY) ?? "[]")
    if (Array.isArray(history) && history.length > 0) {
      localStorage.setItem(ONBOARDED_KEY, "auto")
      return false
    }
    return true
  } catch {
    return false
  }
}

const noop = () => () => {}

/** Home only. Waits for the cookie notice to be answered, so the two never pile up. */
export function LazyWelcome({ categories }: { categories: { slug: string; name: string }[] }) {
  const consent = useAnalyticsConsent()
  const cookieNoticePending = consent === "unset" || consent === "unknown"
  const first = useSyncExternalStore(noop, () => !cookieNoticePending && isFirstVisit(), () => false)
  const [manual, setManual] = useState(false)

  useEffect(() => {
    const open = () => setManual(true)
    window.addEventListener(WELCOME_OPEN, open)
    return () => window.removeEventListener(WELCOME_OPEN, open)
  }, [])

  if (!first && !manual) return null
  return <WelcomeDialog categories={categories} delay={manual ? 0 : 1500} />
}
