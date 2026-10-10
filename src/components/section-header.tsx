import { ChevronRight } from "lucide-react"
import Link from "next/link"

export function SectionHeader({
  title,
  href = "#",
  linkLabel = "Ver tudo",
}: {
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 className="min-w-0 text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      <Link
        href={href}
        className="-my-2.5 flex shrink-0 items-center gap-1 rounded-md py-2.5 text-sm font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {linkLabel}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}
