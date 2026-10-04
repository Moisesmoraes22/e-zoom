"use client"

import { useSyncExternalStore } from "react"

import { cn, formatSeenAt, formatTimeAgo } from "@/lib/utils"

const subscribe = () => () => {}

type Age = "fresh" | "recent" | "old"

function ageOf(iso: string): Age {
  const minutes = (Date.now() - new Date(iso).getTime()) / 60_000
  return minutes < 60 ? "fresh" : minutes < 1440 ? "recent" : "old"
}

/**
 * "há 8 min" is time-dependent, so the server (and cached ISR HTML) renders the
 * absolute date and the browser swaps in the relative one after hydration.
 */
export function TimeAgo({
  iso,
  relativeOnly = false,
}: {
  iso: string
  /** Render nothing until hydration instead of the absolute date (when it is shown next to it). */
  relativeOnly?: boolean
}) {
  const relative = useSyncExternalStore(
    subscribe,
    () => formatTimeAgo(iso),
    () => null,
  )
  return (
    <time dateTime={iso} title={`Preço visto em ${formatSeenAt(iso)}`}>
      {relative ?? (relativeOnly ? "" : formatSeenAt(iso))}
    </time>
  )
}

/**
 * Small dot next to "visto há…": green within the hour, neutral within a day,
 * faint after that. Decoration only; the text carries the meaning.
 */
export function AgeDot({ iso, className }: { iso: string; className?: string }) {
  const age = useSyncExternalStore<Age | null>(
    subscribe,
    () => ageOf(iso),
    () => null,
  )
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
        age === "fresh" ? "bg-primary" : age === "recent" ? "bg-muted-foreground/60" : "bg-muted-foreground/30",
        className,
      )}
    />
  )
}
