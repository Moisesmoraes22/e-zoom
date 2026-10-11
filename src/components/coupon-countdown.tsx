"use client"

import { Clock } from "lucide-react"
import { useEffect, useState } from "react"

import { cn, formatDay } from "@/lib/utils"

const HOUR = 3_600_000
const DAY = 24 * HOUR

/** "1 d 5 h" / "5 h 12 min" / "12 min": only the two largest units, which is all a countdown needs. */
function remaining(ms: number) {
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / 60_000)
  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${Math.max(1, minutes)} min`
}

/**
 * The coupon's own end date, as a countdown in the last two days ("Vence em 5 h 12 min"), and as
 * the plain date before that. The server renders the date; the countdown is client-only because it
 * depends on the clock. Only coupons that have an end date get one: nothing here is invented.
 */
export function CouponCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clock read after mount, so the server HTML stays the plain date
    setNow(Date.now())
    const timer = setInterval(() => {
      if (!document.hidden) setNow(Date.now())
    }, 30_000)
    return () => clearInterval(timer)
  }, [])

  const left = now === null ? null : Date.parse(expiresAt) - now
  if (left === null || left >= 2 * DAY) return <li>Válido até {formatDay(expiresAt)}</li>
  if (left <= 0) return <li className="font-semibold text-destructive">Cupom encerrado</li>

  const urgent = left < DAY
  return (
    <li className={cn("flex items-center gap-1.5 font-semibold", urgent ? "text-destructive" : "text-foreground")}>
      <Clock className="h-4 w-4 shrink-0" aria-hidden />
      <span>
        Vence em <time dateTime={expiresAt}>{remaining(left)}</time>
      </span>
    </li>
  )
}
