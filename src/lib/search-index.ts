"use client"

import { useSyncExternalStore } from "react"

import type { StoreSource } from "@/lib/types"

export interface IndexItem {
  id: string
  title: string
  price: number
  category: string
  store: StoreSource
}

export interface IndexState {
  status: "idle" | "loading" | "ready" | "error"
  items: IndexItem[]
}

const IDLE: IndexState = { status: "idle", items: [] }
let state = IDLE
const listeners = new Set<() => void>()

function set(next: IndexState) {
  state = next
  listeners.forEach((listener) => listener())
}

/** Starts the one-time fetch (a failed one can be retried by calling again). */
export function loadSearchIndex() {
  if (state.status === "loading" || state.status === "ready") return
  set({ status: "loading", items: [] })
  fetch("/api/search-index")
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status))
      return response.json() as Promise<IndexItem[]>
    })
    .then((items) => set({ status: "ready", items }))
    .catch(() => set({ status: "error", items: [] }))
}

export function useSearchIndex(): IndexState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => IDLE,
  )
}
