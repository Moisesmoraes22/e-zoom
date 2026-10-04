import { ChevronRight } from "lucide-react"
import Link from "next/link"

export function SectionHeader({
  title,
  subtitle,
  href = "#",
  linkLabel = "Ver tudo",
  icon,
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  /** An element (e.g. `<Flame className="h-5 w-5" />`): components cannot cross the server/client boundary. */
  icon?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
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
        className="flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
