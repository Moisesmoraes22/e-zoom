"use client"

import { useId } from "react"

import { cn } from "@/lib/utils"

/** Tiny inline line chart of recorded prices, oldest first. */
export function PriceSparkline({
  values,
  className,
}: {
  values: number[]
  className?: string
}) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${26 - ((v - min) / range) * 24}`)
    .join(" ")

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-7 w-20 overflow-visible", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

/**
 * Small area chart for the hero chip. A price holds until it changes, so the line is a STEP line
 * (a diagonal between two records would show prices that never existed), filled below, with a dot
 * on the current price. Same data as PriceSparkline: oldest first.
 */
export function PriceTrend({ values, className }: { values: number[]; className?: string }) {
  const id = useId()
  if (values.length < 2) return null
  const W = 64
  const H = 32
  const PAD = 5
  const min = Math.min(...values)
  const range = Math.max(...values) - min || 1
  const x = (i: number) => PAD + (i / (values.length - 1)) * (W - PAD * 2)
  const y = (v: number) => PAD + (1 - (v - min) / range) * (H - PAD * 2 - 2)

  // Horizontal to the next record's x, then vertical to its price.
  let line = `M${x(0)},${y(values[0])}`
  for (let i = 1; i < values.length; i++) line += ` H${x(i)} V${y(values[i])}`
  const last = values.length - 1
  const area = `${line} V${H} H${x(0)} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden className={cn("h-8 w-16 overflow-visible", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last)} cy={y(values[last])} r="5" fill="currentColor" opacity="0.2" />
      <circle cx={x(last)} cy={y(values[last])} r="2.8" fill="currentColor" stroke="var(--card)" strokeWidth="1.5" />
    </svg>
  )
}
