"use client"

import { useEffect, useState } from "react"

import { ListingFallback } from "@/components/listing-fallback"
import { SearchResults } from "@/components/search-results"
import type { CategoryCount } from "@/lib/deals"
import type { Product, SearchItem } from "@/lib/types"

interface Part {
  items: SearchItem[]
  parts: number
}

const fetchPart = async (part: number): Promise<Part> => {
  const response = await fetch(`/api/search-index?part=${part}`)
  if (!response.ok) throw new Error(`search-index ${response.status}`)
  return response.json()
}

/**
 * /busca ships only its first page in the HTML (instant, and readable by search engines); the search
 * fields of every offer are fetched right after, from a cached route, and the interactive list
 * takes over. On failure the first page simply stays, with its links.
 */
export function SearchLoader({
  seedCards,
  categories,
  total,
}: {
  seedCards: Product[]
  categories: CategoryCount[]
  total: number
}) {
  const [items, setItems] = useState<SearchItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchPart(0)
      .then(async (first) => {
        const rest = await Promise.all(Array.from({ length: first.parts - 1 }, (_, i) => fetchPart(i + 1)))
        if (!cancelled) setItems([...first.items, ...rest.flatMap((r) => r.items)])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!items) return <ListingFallback title="Todas as ofertas" total={total} cards={seedCards} />
  return <SearchResults products={items} seedCards={seedCards} categories={categories} />
}
