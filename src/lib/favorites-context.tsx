"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import { useAuth } from "@/components/auth-provider"
import { createFavoritesApi } from "@/lib/favorites-api"
import { isOfferId, mergeLoaded, syncFavorites, type FavoritesApi } from "@/lib/favorites-sync"
import type { Product } from "@/lib/types"

export interface FavoriteFlight {
  id: string
  image: string
  from: DOMRect
  to: DOMRect
}

/** idle = visitor; syncing / synced / error only apply while signed in. */
export type SyncState = "idle" | "syncing" | "synced" | "error"

interface FavoritesContextValue {
  items: Product[]
  count: number
  isOpen: boolean
  setOpen: (open: boolean) => void
  openFavorites: () => void
  closeFavorites: () => void
  addFavorite: (product: Product) => void
  removeFavorite: (id: string) => void
  toggleFavorite: (product: Product) => void
  isFavorite: (id: string) => boolean
  clear: () => void
  favoritesIconRef: RefObject<HTMLButtonElement | null>
  flights: FavoriteFlight[]
  launchFlight: (originEl: HTMLElement, image: string) => void
  completeFlight: (id: string) => void
  bumpSignal: number
  signedIn: boolean
  syncState: SyncState
  retrySync: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)
const STORAGE_KEY = "hibridlink:favorites"
// Removals the account has not confirmed yet; retried first on the next sync so a
// favorite removed while offline is not brought back by the merge.
const PENDING_KEY = "hibridlink:favorites-pending"
// Ids known to be in the account. Kept on the device so that signing out (or an expired
// session) removes the account's favorites from the screen even after a page reload.
const ACCOUNT_KEY = "hibridlink:favorites-account"

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const signedIn = status === "authenticated"

  const [items, setItems] = useState<Product[]>([])
  const [isOpen, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [flights, setFlights] = useState<FavoriteFlight[]>([])
  const [bumpSignal, setBumpSignal] = useState(0)
  const [syncState, setSyncState] = useState<SyncState>("idle")
  const favoritesIconRef = useRef<HTMLButtonElement | null>(null)

  const itemsRef = useRef<Product[]>([])
  const accountIdsRef = useRef<Set<string>>(new Set())
  const pendingRef = useRef<Set<string>>(new Set())
  const runRef = useRef(0)
  const wasSignedInRef = useRef(false)
  const apiRef = useRef<FavoritesApi | null>(null)
  const getApi = () => (apiRef.current ??= createFavoritesApi())

  const persistPending = () => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify([...pendingRef.current]))
    } catch {
      // storage unavailable: the removal is still retried in this session
    }
  }

  const persistAccount = () => {
    try {
      if (accountIdsRef.current.size === 0) localStorage.removeItem(ACCOUNT_KEY)
      else localStorage.setItem(ACCOUNT_KEY, JSON.stringify([...accountIdsRef.current]))
    } catch {
      // storage unavailable
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage after mount, avoids SSR/client mismatch
      if (raw) setItems(JSON.parse(raw))
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]")
      if (Array.isArray(pending)) pendingRef.current = new Set(pending.filter((id) => typeof id === "string"))
      const account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "[]")
      if (Array.isArray(account)) accountIdsRef.current = new Set(account.filter((id) => typeof id === "string"))
    } catch {
      // ignore malformed/inaccessible storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota/private-mode errors
    }
  }, [items, hydrated])

  /**
   * Merges the device list with the account's. The device list is only replaced after
   * every step succeeded (see syncFavorites); on any failure it stays exactly as it was.
   */
  const runSync = useCallback(async () => {
    const run = ++runRef.current
    setSyncState("syncing")
    try {
      const result = await syncFavorites(getApi(), itemsRef.current, pendingRef.current)
      persistPending()
      if (run !== runRef.current) return
      accountIdsRef.current = result.accountIds
      persistAccount()
      setItems((prev) => mergeLoaded(prev, result.loaded))
      setSyncState("synced")
    } catch {
      persistPending()
      if (run === runRef.current) setSyncState("error")
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (signedIn) {
      wasSignedInRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- starts the account sync when the session appears
      void runSync()
    } else if (status === "anonymous" && (wasSignedInRef.current || accountIdsRef.current.size > 0)) {
      // Signed out, the session expired, or the device still holds the account's favorites
      // from an earlier session that is gone: they must not stay on screen as if they were
      // the visitor's. They are safe in the account; anything that never reached it (a
      // failed sync) stays on the device.
      wasSignedInRef.current = false
      runRef.current++
      setItems((prev) => prev.filter((item) => !accountIdsRef.current.has(item.id)))
      accountIdsRef.current = new Set()
      pendingRef.current = new Set()
      persistAccount()
      persistPending()
      setSyncState("idle")
    }
  }, [status, signedIn, hydrated, runSync])

  const fail = () => setSyncState("error")

  const pushAdd = (id: string) => {
    if (!signedIn || !isOfferId(id)) return
    getApi()
      .addMany([id])
      .then(() => {
        accountIdsRef.current.add(id)
        persistAccount()
      })
      .catch(fail)
  }

  const pushRemove = (id: string) => {
    if (!signedIn || !isOfferId(id)) return
    pendingRef.current.add(id)
    persistPending()
    getApi()
      .removeOne(id)
      .then(() => {
        pendingRef.current.delete(id)
        accountIdsRef.current.delete(id)
        persistAccount()
        persistPending()
      })
      .catch(fail)
  }

  const commit = (next: Product[]) => {
    itemsRef.current = next
    setItems(next)
  }

  const addFavorite = (product: Product) => {
    if (itemsRef.current.some((i) => i.id === product.id)) return
    commit([...itemsRef.current, product])
    pushAdd(product.id)
  }

  const removeFavorite = (id: string) => {
    commit(itemsRef.current.filter((i) => i.id !== id))
    pushRemove(id)
  }

  const toggleFavorite = (product: Product) => {
    if (itemsRef.current.some((i) => i.id === product.id)) removeFavorite(product.id)
    else addFavorite(product)
  }

  const clear = () => {
    const ids = itemsRef.current.map((i) => i.id)
    commit([])
    ids.forEach(pushRemove)
  }

  const launchFlight = (originEl: HTMLElement, image: string) => {
    const target = favoritesIconRef.current
    if (!target) return
    const from = originEl.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setFlights((prev) => [...prev, { id, image, from, to }])
  }

  const completeFlight = (id: string) => {
    setFlights((prev) => prev.filter((f) => f.id !== id))
    setBumpSignal((n) => n + 1)
  }

  const count = items.length

  const value = useMemo<FavoritesContextValue>(
    () => ({
      items,
      count,
      isOpen,
      setOpen,
      openFavorites: () => setOpen(true),
      closeFavorites: () => setOpen(false),
      addFavorite,
      removeFavorite,
      toggleFavorite,
      isFavorite: (id: string) => items.some((i) => i.id === id),
      clear,
      favoritesIconRef,
      flights,
      launchFlight,
      completeFlight,
      bumpSignal,
      signedIn,
      syncState,
      retrySync: () => void runSync(),
    }),
    // the mutators only read refs and `signedIn`, so they follow it
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, count, isOpen, flights, bumpSignal, signedIn, syncState, runSync],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return ctx
}
