"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"

import type { Product } from "@/lib/types"

export interface FavoriteFlight {
  id: string
  image: string
  from: DOMRect
  to: DOMRect
}

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
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)
const STORAGE_KEY = "hibridlink:favorites"

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])
  const [isOpen, setOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [flights, setFlights] = useState<FavoriteFlight[]>([])
  const [bumpSignal, setBumpSignal] = useState(0)
  const favoritesIconRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from storage after mount, avoids SSR/client mismatch
      if (raw) setItems(JSON.parse(raw))
    } catch {
      // ignore malformed/inaccessible storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore quota/private-mode errors
    }
  }, [items, hydrated])

  const addFavorite = (product: Product) => {
    setItems((prev) =>
      prev.some((i) => i.id === product.id) ? prev : [...prev, product],
    )
  }

  const removeFavorite = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const toggleFavorite = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === product.id)
      if (exists) return prev.filter((i) => i.id !== product.id)
      return [...prev, product]
    })
  }

  const clear = () => setItems([])

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
    }),
    [items, count, isOpen, flights, bumpSignal],
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
