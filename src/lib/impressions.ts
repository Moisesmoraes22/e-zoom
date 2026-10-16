/**
 * Exibições: how many times each offer was really shown, so clicks can be read against the chances an
 * offer had (CTR = clicks ÷ exibições). One exibição = the card at least half on screen for 1 second,
 * counted once per page (per list and offer). Only numbers leave the browser: offer, list name and
 * position range, nothing about the visitor. Robots and automated browsers are not counted.
 */

/** List names accepted by the server: lowercase words and digits joined by "-". */
export const SHELF_NAME = /^[a-z0-9-]{1,40}$/

/** Position in a list kept as a range (1, 2, 3, 4, 5-8, 9-16, 17+), so the numbers stay few and comparable. */
export function positionBucket(position: number | undefined): number {
  if (!position || !Number.isFinite(position) || position < 1) return 0
  if (position <= 4) return Math.floor(position)
  if (position <= 8) return 5
  if (position <= 16) return 9
  return 17
}

/** Site area of a page, used as the list name when a card is not inside a named list. */
export function areaOf(pathname: string) {
  const area = pathname.split("/")[1] ?? ""
  return area === "" ? "home" : ["busca", "categoria", "produto"].includes(area) ? area : "outro"
}

const VISIBLE_MS = 1000
const BATCH = 60
const BOT = /bot|crawl|spider|headless|lighthouse|preview/i

interface Watched {
  id: string
  shelf: string
  position: number
  timer?: number
}

let observer: IntersectionObserver | null = null
const watched = new WeakMap<Element, Watched>()
const counted = new Set<string>()
const queue: { o: string; s: string; p: number }[] = []
let flushTimer = 0

const enabled = () =>
  typeof window !== "undefined" && "IntersectionObserver" in window && !navigator.webdriver && !BOT.test(navigator.userAgent)

function send(items: typeof queue) {
  const body = JSON.stringify({ items })
  if (!navigator.sendBeacon?.("/api/impressions", new Blob([body], { type: "application/json" }))) {
    void fetch("/api/impressions", { method: "POST", body, keepalive: true }).catch(() => {})
  }
}

/** Sends what is waiting (also when the page is hidden or left, so nothing is lost). */
export function flushImpressions() {
  window.clearTimeout(flushTimer)
  flushTimer = 0
  while (queue.length) send(queue.splice(0, BATCH))
}

function count(w: Watched) {
  const page = location.pathname + location.search
  const shelf = w.shelf || areaOf(location.pathname)
  const key = `${page}|${shelf}|${w.id}`
  if (counted.has(key)) return
  counted.add(key)
  queue.push({ o: w.id, s: shelf, p: w.position })
  if (queue.length >= BATCH) flushImpressions()
  else if (!flushTimer) flushTimer = window.setTimeout(flushImpressions, 10_000)
}

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const w = watched.get(entry.target)
        if (!w) continue
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          w.timer ??= window.setTimeout(() => {
            w.timer = undefined
            count(w)
          }, VISIBLE_MS)
        } else if (w.timer) {
          window.clearTimeout(w.timer)
          w.timer = undefined
        }
      }
    },
    { threshold: [0, 0.5] },
  )
  window.addEventListener("pagehide", flushImpressions)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushImpressions()
  })
  return observer
}

/** Starts watching one card; returns the function that stops it (for a React effect cleanup). */
export function observeImpression(el: Element | null, id: string, shelf: string, position?: number) {
  if (!el || !enabled()) return () => {}
  watched.set(el, { id, shelf, position: positionBucket(position) })
  const obs = getObserver()
  obs.observe(el)
  return () => {
    const w = watched.get(el)
    if (w?.timer) window.clearTimeout(w.timer)
    watched.delete(el)
    obs.unobserve(el)
  }
}
