import { STORES } from "@/lib/mock-data"
import type { StoreSource } from "@/lib/types"
import { cn } from "@/lib/utils"

export function StoreBadge({
  store,
  className,
  variant = "solid",
}: {
  store: StoreSource
  className?: string
  variant?: "solid" | "minimal"
}) {
  const data = STORES[store]

  if (variant === "minimal") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: data.color }}
          aria-hidden
        />
        {data.name}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-black/80",
        className,
      )}
      style={{ backgroundColor: `${data.color}` }}
    >
      {data.name}
    </span>
  )
}
