import { CATEGORIES } from "@/lib/mock-data"
import { offerScore, variantKey } from "@/lib/deals"
import { normalizeText, queryGroups } from "@/lib/search"
import type { Product } from "@/lib/types"

/**
 * Interests, kept ONLY in this browser (localStorage): what was searched, opened, clicked
 * and favourited. Nothing here is ever sent to the server. Old events fade (half-life 7
 * days), so the profile follows what the person wants now.
 */
export type InterestKind = "search" | "view" | "click" | "favorite"

interface InterestEvent {
  t: number
  kind: InterestKind
  category?: string
  terms: string[]
  id?: string
}

export const INTERESTS_KEY = "ezoom:interests:v1"
export const INTERESTS_CHANGED = "ezoom:interests-changed"
const MAX_EVENTS = 150
const HALF_LIFE_MS = 7 * 86_400_000
const WEIGHT: Record<InterestKind, number> = { favorite: 5, click: 4, search: 3, view: 2 }
/** Below this much (decayed) weight there is not enough to recommend anything. */
export const MIN_PROFILE_WEIGHT = 4

const STOP = new Set(
  "para com sem kit uni unidade unidades pecas peca cores cor preto preta branco branca azul rosa vermelho verde cinza masculino masculina feminino feminina adulto infantil original premium pro max mini plus novo nova super mega".split(" "),
)

/** The meaningful words of a title: brand/type words, no sizes, colours or filler. */
export function titleTerms(title: string): string[] {
  const words = normalizeText(title).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !/\d/.test(w) && !STOP.has(w))
  return [...new Set(words)].slice(0, 6)
}

function readEvents(): InterestEvent[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(INTERESTS_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function record(event: Omit<InterestEvent, "t">) {
  if (typeof window === "undefined" || event.terms.length === 0 && !event.category) return
  try {
    const past = readEvents()
    const last = past.at(-1)
    // The same product opened again right away (reload, double effect) counts once.
    if (last && last.kind === event.kind && last.id === event.id && event.id && Date.now() - last.t < 60_000) return
    const events = [...past, { ...event, t: Date.now() }].slice(-MAX_EVENTS)
    localStorage.setItem(INTERESTS_KEY, JSON.stringify(events))
    window.dispatchEvent(new Event(INTERESTS_CHANGED))
  } catch {
    // storage blocked or full: no profile, the site works the same
  }
}

export const recordProduct = (kind: Exclude<InterestKind, "search">, p: Pick<Product, "id" | "title" | "category">) =>
  record({ kind, category: p.category, terms: titleTerms(p.title), id: p.id })

export const recordSearch = (query: string) =>
  record({ kind: "search", terms: queryGroups(query).map((g) => g[0]).filter((w) => w.length >= 3) })

export function clearInterests() {
  try {
    localStorage.removeItem(INTERESTS_KEY)
    window.dispatchEvent(new Event(INTERESTS_CHANGED))
  } catch {}
}

export interface Profile {
  categories: Map<string, number>
  terms: Map<string, { weight: number; fromSearch: number }>
  /** Offers already opened, clicked or favourited: not recommended again. */
  seen: Set<string>
  total: number
}

export function buildProfile(raw: string, now = Date.now()): Profile {
  let events: InterestEvent[] = []
  try {
    const parsed = JSON.parse(raw || "[]")
    if (Array.isArray(parsed)) events = parsed
  } catch {}
  const profile: Profile = { categories: new Map(), terms: new Map(), seen: new Set(), total: 0 }
  for (const e of events) {
    const w = WEIGHT[e.kind] * 0.5 ** (Math.max(0, now - e.t) / HALF_LIFE_MS)
    profile.total += w
    if (e.category) profile.categories.set(e.category, (profile.categories.get(e.category) ?? 0) + w)
    for (const term of e.terms) {
      const cur = profile.terms.get(term) ?? { weight: 0, fromSearch: 0 }
      cur.weight += w
      if (e.kind === "search") cur.fromSearch += w
      profile.terms.set(term, cur)
    }
    if (e.id) profile.seen.add(e.id)
  }
  return profile
}

export interface Recommendation {
  product: Product
  reason: string
}

const MAX_PER_STORE = 5
const MAX_PER_CATEGORY = 5

/**
 * Best offers of the pool for this profile. An offer needs a real link to the profile
 * (a shared word, or a category the person clearly likes); among those, the usual offer
 * quality score breaks the order. Never repeats a product, and mixes stores/categories.
 */
export function recommend(pool: Product[], profile: Profile, size = 9, now = Date.now()): Recommendation[] {
  if (profile.total < MIN_PROFILE_WEIGHT) return []
  const maxCat = Math.max(0, ...profile.categories.values())
  const maxTerm = Math.max(0, ...[...profile.terms.values()].map((t) => t.weight))

  const scored = pool
    .filter((p) => !profile.seen.has(p.id))
    .map((p) => {
      const title = normalizeText(p.title)
      const catShare = maxCat ? (profile.categories.get(p.category) ?? 0) / maxCat : 0
      let termScore = 0
      let best: { term: string; weight: number; search: boolean } | null = null
      for (const [term, t] of profile.terms) {
        if (!title.includes(term)) continue
        const share = t.weight / maxTerm
        termScore += share
        if (!best || t.weight > best.weight) best = { term, weight: t.weight, search: t.fromSearch >= t.weight / 2 }
      }
      termScore = Math.min(termScore, 3)
      if (termScore === 0 && catShare < 0.5) return null
      const categoryName = CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category
      const reason = best
        ? best.search ? `Porque você buscou “${best.term}”` : `Do seu interesse em “${best.term}”`
        : `Porque você olhou ${categoryName}`
      return { product: p, reason, score: catShare * 10 + termScore * 20 + offerScore(p, now) * 0.25 }
    })
    .filter((e): e is Recommendation & { score: number } => e !== null)
    .sort((a, b) => b.score - a.score)

  const picked: Recommendation[] = []
  const stores = new Map<string, number>()
  const categories = new Map<string, number>()
  const variants = new Set<string>()
  // Someone who only cares about one category should still get a full row of it.
  const categoryCap = profile.categories.size < 2 ? size : MAX_PER_CATEGORY
  for (const e of scored) {
    const key = variantKey(e.product.title)
    if (variants.has(key)) continue
    if ((stores.get(e.product.store) ?? 0) >= MAX_PER_STORE) continue
    if ((categories.get(e.product.category) ?? 0) >= categoryCap) continue
    variants.add(key)
    stores.set(e.product.store, (stores.get(e.product.store) ?? 0) + 1)
    categories.set(e.product.category, (categories.get(e.product.category) ?? 0) + 1)
    picked.push({ product: e.product, reason: e.reason })
    if (picked.length === size) break
  }
  return picked
}
