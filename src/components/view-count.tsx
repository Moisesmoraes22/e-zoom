"use client"

import { Eye } from "lucide-react"
import { useEffect, useState } from "react"

/** Below this the number would not persuade anyone, so nothing is shown (it is never rounded up). */
const MIN_VIEWS = 5

/**
 * "N pessoas viram esta oferta nas últimas 24 h": the real count of product-page views. Counts a
 * visitor once per browser session; later opens of the same page only read the number.
 */
export function ViewCount({ offerId }: { offerId: string }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    const key = `ez:view:${offerId}`
    let seen = false
    try {
      seen = sessionStorage.getItem(key) === "1"
      sessionStorage.setItem(key, "1")
    } catch {}
    if (seen) return
    fetch("/api/view", { method: "POST", body: JSON.stringify({ offerId }) })
      .then((r) => r.json())
      .then((d: { n?: number }) => setN(typeof d.n === "number" ? d.n : 0))
      .catch(() => {})
  }, [offerId])

  if (n < MIN_VIEWS) return null
  return (
    <li className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-brand">
      <Eye className="h-3.5 w-3.5" aria-hidden />
      {n} pessoas viram esta oferta nas últimas 24 h
    </li>
  )
}
