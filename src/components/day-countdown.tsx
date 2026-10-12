"use client"

import { Clock } from "lucide-react"
import { useEffect, useState, useSyncExternalStore } from "react"

const HOUR = 3_600_000
const DAY = 24 * HOUR
const BRASILIA = 3 * HOUR // UTC-3, no daylight saving time since 2019

/**
 * Time left until the day's list renews: the next midnight in Brasília. The list it sits beside is
 * built from prices that fell TODAY, so this is a real boundary, not a marketing timer. The server
 * renders the plain sentence; the clock needs the browser's time.
 */
export function DayCountdown() {
  const [left, setLeft] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const nextMidnight = Math.floor((now - BRASILIA) / DAY) * DAY + DAY + BRASILIA
      setLeft(nextMidnight - now)
    }
    tick()
    const timer = setInterval(() => {
      if (!document.hidden) tick()
    }, 30_000)
    return () => clearInterval(timer)
  }, [])

  const hours = left === null ? 0 : Math.floor(left / HOUR)
  const minutes = left === null ? 0 : Math.floor((left % HOUR) / 60_000)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {left === null ? "Renova à meia-noite" : <>Renova em {hours} h {minutes} min</>}
    </span>
  )
}

// One shared 1 s clock for every card pill on the page (a timer per card would be dozens of intervals).
const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | undefined
let cached = 0

const secondsToMidnight = () => {
  const now = Date.now()
  const nextMidnight = Math.floor((now - BRASILIA) / DAY) * DAY + DAY + BRASILIA
  return Math.floor((nextMidnight - now) / 1000)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    cached = secondsToMidnight()
    timer = setInterval(() => {
      if (document.hidden) return
      const next = secondsToMidnight()
      if (next === cached) return
      cached = next
      listeners.forEach((notify) => notify())
    }, 1000)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) clearInterval(timer)
  }
}

const snapshot = () => (listeners.size > 0 ? cached : secondsToMidnight())
const serverSnapshot = () => null

const two = (n: number) => String(n).padStart(2, "0")

/**
 * "Oferta do dia acaba em 04:43:27": the card belongs to today's list ("Ofertas do dia"), which
 * renews at midnight in Brasília. The label names the DAILY offer, not the store's promotion: the
 * stores do not tell us when theirs ends, so the text never claims it.
 */
function ClockPill({ className }: { className?: string }) {
  const left = useSyncExternalStore<number | null>(subscribe, snapshot, serverSnapshot)
  return (
    <span
      className={
        "inline-flex w-fit items-center gap-1.5 rounded-2xl bg-destructive px-3 py-1 text-[11px] font-bold leading-tight tabular-nums text-white min-[400px]:text-xs " +
        (className ?? "")
      }
      title="A lista de Ofertas do dia renova à meia-noite (horário de Brasília)"
    >
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {left === null
        ? "Oferta do dia acaba à meia-noite"
        : `Oferta do dia acaba em ${two(Math.floor(left / 3600))}:${two(Math.floor((left % 3600) / 60))}:${two(left % 60)}`}
    </span>
  )
}

const clockNow = () => Date.now()

/** Start of the current day in Brasília, as a timestamp. */
const brasiliaDayStart = (now: number) => Math.floor((now - BRASILIA) / DAY) * DAY + BRASILIA

/**
 * The pill, only on offers that really are "of the day": the price fell since midnight in Brasília.
 * Everything else renders nothing (and does not subscribe to the clock).
 */
export function ListClock({ dropAt, className }: { dropAt?: string; className?: string }) {
  if (!dropAt || Date.parse(dropAt) < brasiliaDayStart(clockNow())) return null
  return <ClockPill className={className} />
}
