"use client"

import { useSyncExternalStore } from "react"

import { formatSeenAt, formatTimeAgo } from "@/lib/utils"

const subscribe = () => () => {}

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
