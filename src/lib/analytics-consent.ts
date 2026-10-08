"use client"

import { useSyncExternalStore } from "react"

const KEY = "ezoom:analytics-consent"
const CHANGED = "ezoom:analytics-consent-changed"

/** "yes" / "no" once the visitor chose, "unset" before, and "unknown" on the server (nothing is shown or loaded). */
export type Consent = "yes" | "no" | "unset" | "unknown"

const subscribe = (notify: () => void) => {
  window.addEventListener(CHANGED, notify)
  window.addEventListener("storage", notify)
  return () => {
    window.removeEventListener(CHANGED, notify)
    window.removeEventListener("storage", notify)
  }
}

const read = (): Consent => {
  try {
    const value = localStorage.getItem(KEY)
    return value === "yes" || value === "no" ? value : "unset"
  } catch {
    return "unset"
  }
}

export const useAnalyticsConsent = (): Consent => useSyncExternalStore(subscribe, read, () => "unknown")

/** `null` forgets the choice, which brings the notice back. */
export function setAnalyticsConsent(value: "yes" | "no" | null) {
  try {
    if (value) localStorage.setItem(KEY, value)
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked: the choice only lasts until the page is closed, and nothing is loaded anyway.
  }
  window.dispatchEvent(new Event(CHANGED))
}
