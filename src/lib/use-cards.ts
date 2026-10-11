"use client"

import { useEffect, useRef, useState } from "react"

import type { Product } from "@/lib/types"

/**
 * Full offers for the ids on screen. `seed` (the default first page, sent with the page)
 * shows at once; the rest is fetched from /api/cards as the visible ids change, and kept.
 * Ids still missing have no card yet; `failed` turns on if a fetch fails (`retry` tries again).
 */
export function useCards(ids: string[], seed: Product[]) {
  const [cards, setCards] = useState(() => new Map(seed.map((p) => [p.id, p])))
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const asked = useRef(new Set<string>())
  const key = ids.join(",")

  useEffect(() => {
    const missing = key.split(",").filter((id) => id && !cards.has(id) && !asked.current.has(id))
    if (missing.length === 0) return
    missing.forEach((id) => asked.current.add(id))
    // Not cancelled when the ids change: what arrives late is still kept for when it is needed.
    fetch(`/api/cards?ids=${missing.join(",")}`)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<Product[]>
      })
      .then((found) => {
        setFailed(false)
        setCards((prev) => new Map([...prev, ...found.map((p): [string, Product] => [p.id, p])]))
      })
      .catch(() => {
        missing.forEach((id) => asked.current.delete(id))
        setFailed(true)
      })
    // `cards` is read only to skip what is already loaded; reacting to it would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  return { cards, failed, retry: () => { setFailed(false); setAttempt((n) => n + 1) } }
}
