"use client"

import { User } from "lucide-react"
import { useState } from "react"

import { cn } from "@/lib/utils"

/** The profile photo, or the first letter of the name when there is none (or it fails to load). */
export function Avatar({
  url,
  label,
  className,
  tone = "default",
}: {
  url: string | null
  /** Name or e-mail: its first letter is the fallback. */
  label: string
  className?: string
  tone?: "default" | "onBrand"
}) {
  const [failed, setFailed] = useState<string | null>(null)
  const initial = label.trim().charAt(0).toUpperCase()
  const showPhoto = url && failed !== url

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold",
        tone === "onBrand" ? "bg-white text-hero" : "bg-primary text-primary-foreground",
        className,
      )}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          width={256}
          height={256}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(url)}
          className="h-full w-full object-cover"
        />
      ) : (
        initial || <User className="h-1/2 w-1/2" />
      )}
    </span>
  )
}
