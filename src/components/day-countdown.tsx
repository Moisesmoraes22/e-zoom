"use client"

import { Clock } from "lucide-react"
import { useEffect, useState } from "react"

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock read after mount, so the server HTML stays static
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
