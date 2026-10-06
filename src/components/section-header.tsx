import { ChevronRight } from "lucide-react"
import Link from "next/link"

/** Soft circle behind a section icon, coloured by what the icon means (fire = orange, price drop = green, ...). */
export const ICON_TONES = {
  fire: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  drop: "bg-green-600/15 text-green-700 dark:text-green-400",
  spark: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  blue: "bg-primary/15 text-brand",
} as const
export type IconTone = keyof typeof ICON_TONES

export function SectionHeader({
  title,
  subtitle,
  href = "#",
  linkLabel = "Ver tudo",
  icon,
  tone = "blue",
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  /** An element (e.g. `<Flame className="h-5 w-5" />`): components cannot cross the server/client boundary. */
  icon?: React.ReactNode
  tone?: IconTone
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            aria-hidden
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${ICON_TONES[tone]}`}
          >
            {icon}
          </span>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
