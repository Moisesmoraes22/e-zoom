"use client"

import { useSyncExternalStore } from "react"

/**
 * Live open counts for the fire badge. One request per page load, shared by every card, refreshed
 * every minute while the tab is visible. `null` until the first answer (or if it fails): the card
 * then keeps the count the page was built with.
 */
type Hot = Record<string, number>

const REFRESH_MS = 60_000
const listeners = new Set<() => void>()
let hot: Hot | null = null
let timer: ReturnType<typeof setInterval> | undefined

async function load() {
  try {
    const res = await fetch("/api/hot")
    if (!res.ok) return
    hot = (await res.json()) as Hot
    listeners.forEach((l) => l())
  } catch {
    // offline: keep what we have
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    void load()
    timer = setInterval(() => {
      if (!document.hidden) void load()
    }, REFRESH_MS)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(timer)
  }
}

/** Opens of this offer in 14 days, as of now; `fallback` (the number baked into the page) until known. */
export function useHotClicks(offerId: string, fallback: number | undefined) {
  const live = useSyncExternalStore(subscribe, () => hot, () => null)
  return live ? (live[offerId] ?? 0) : (fallback ?? 0)
}
