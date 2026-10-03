import { ChevronRight } from "lucide-react"

export function SectionHeader({
  title,
  subtitle,
  href = "#",
}: {
  title: string
  subtitle?: string
  href?: string
}) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <a
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        Ver tudo
        <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  )
}
