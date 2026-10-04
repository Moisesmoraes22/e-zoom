"use client"

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react"

import { useTheme, type Theme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
]

/** Claro / Escuro / Sistema as a radio group (arrow keys move between options). */
export function ThemeToggle({
  showLabels = false,
  className,
}: {
  showLabels?: boolean
  className?: string
}) {
  const { theme, setTheme } = useTheme()

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0
    if (!step) return
    event.preventDefault()
    const index = OPTIONS.findIndex((o) => o.value === theme)
    const next = OPTIONS[(index + step + OPTIONS.length) % OPTIONS.length]
    setTheme(next.value)
    ;(event.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null)?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Aparência"
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = theme === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            data-value={value}
            tabIndex={selected ? 0 : -1}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              showLabels ? "flex-1 px-3" : "w-8",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {showLabels && label}
          </button>
        )
      })}
    </div>
  )
}
