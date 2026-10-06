"use client"

import { useSyncExternalStore } from "react"

import { INTERESTS_CHANGED, INTERESTS_KEY, PERSONALIZE_KEY } from "@/lib/interest-profile"

const subscribe = (notify: () => void) => {
  window.addEventListener(INTERESTS_CHANGED, notify)
  window.addEventListener("storage", notify)
  return () => {
    window.removeEventListener(INTERESTS_CHANGED, notify)
    window.removeEventListener("storage", notify)
  }
}

const read = (key: string) => {
  try {
    return localStorage.getItem(key) ?? ""
  } catch {
    return ""
  }
}

/** The stored interests (raw JSON, "" on the server or when empty); updates when they change. */
export const useInterestsRaw = () => useSyncExternalStore(subscribe, () => read(INTERESTS_KEY), () => "")

/** Whether lists may be reordered by the profile (on unless the visitor turned it off). */
export function usePersonalize(): [boolean, (on: boolean) => void] {
  const stored = useSyncExternalStore(subscribe, () => read(PERSONALIZE_KEY), () => "")
  const set = (on: boolean) => {
    try {
      if (on) localStorage.removeItem(PERSONALIZE_KEY)
      else localStorage.setItem(PERSONALIZE_KEY, "off")
      window.dispatchEvent(new Event(INTERESTS_CHANGED))
    } catch {}
  }
  return [stored !== "off", set]
}
