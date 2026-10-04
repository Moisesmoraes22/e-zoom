"use client"

import { ArrowRight, Clock, Loader2, Search, TriangleAlert, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { categoryIcon } from "@/lib/category-icons"
import { CATEGORIES } from "@/lib/mock-data"
import { normalizeText } from "@/lib/search"
import { loadSearchIndex, useSearchIndex } from "@/lib/search-index"
import { cn, formatCurrency } from "@/lib/utils"

const RECENT_KEY = "hl-recent-searches"
const MAX_RECENT = 5
/** Rows shown before the user types: keeps the panel from covering the page. */
const MAX_IDLE_ROWS = 4

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
    return Array.isArray(parsed)
      ? parsed.filter((q) => typeof q === "string").slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

function saveRecent(query: string) {
  try {
    const next = [query, ...readRecent().filter((q) => q !== query)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // private mode / blocked storage: recents are optional
  }
}

interface Row {
  key: string
  href: string
  label: string
  hint?: string
  icon: React.ReactNode
  /** remembered when picked, so it shows up under "Buscas recentes" */
  remember?: string
}

const searchHref = (query: string) => `/busca?q=${encodeURIComponent(query)}`

export function SearchBar({
  className,
  defaultValue,
  size = "lg",
}: {
  className?: string
  defaultValue?: string
  size?: "lg" | "sm"
}) {
  const router = useRouter()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(defaultValue ?? "")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])
  const index = useSearchIndex()

  const query = value.trim()
  const normalized = normalizeText(query)

  // Real data only: products and per-category counts come from the live catalog.
  const { rows, message } = useMemo(() => {
    const rows: Row[] = []
    let message: { text: string; tone: "info" | "error" } | null = null

    const categoryCounts = new Map<string, number>()
    for (const item of index.items) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1)
    }
    const categoryRow = (slug: string, name: string): Row => {
      const Icon = categoryIcon(slug)
      const count = categoryCounts.get(slug) ?? 0
      return {
        key: `c-${slug}`,
        href: `/categoria/${slug}`,
        label: name,
        hint: `${count} ${count === 1 ? "oferta" : "ofertas"}`,
        icon: <Icon className="h-4 w-4 text-brand" aria-hidden />,
      }
    }
    const knownCategories = CATEGORIES.filter((c) => categoryCounts.has(c.slug))

    if (normalized.length < 2) {
      for (const q of recent) {
        rows.push({
          key: `r-${q}`,
          href: searchHref(q),
          label: q,
          icon: <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />,
          remember: q,
        })
      }
      if (index.status === "ready") {
        [...knownCategories]
          .sort((a, b) => (categoryCounts.get(b.slug) ?? 0) - (categoryCounts.get(a.slug) ?? 0))
          .slice(0, 6)
          .forEach((c) => rows.push(categoryRow(c.slug, c.name)))
      }
      rows.splice(MAX_IDLE_ROWS)
    } else if (index.status === "ready") {
      const tokens = normalized.split(/\s+/)
      index.items
        .filter((item) => {
          const title = normalizeText(item.title)
          return tokens.every((t) => title.includes(t))
        })
        .slice(0, 5)
        .forEach((item) =>
          rows.push({
            key: `p-${item.id}`,
            href: `/produto/${item.id}`,
            label: item.title,
            hint: formatCurrency(item.price),
            icon: <Search className="h-4 w-4 text-muted-foreground" aria-hidden />,
          }),
        )
      knownCategories
        .filter((c) => normalizeText(c.name).includes(normalized))
        .forEach((c) => rows.push(categoryRow(c.slug, c.name)))
      if (rows.length === 0) {
        message = { text: `Nenhuma sugestão para “${query}”.`, tone: "info" }
      }
      rows.push({
        key: "all",
        href: searchHref(query),
        label: `Ver todos os resultados para “${query}”`,
        icon: <ArrowRight className="h-4 w-4 text-brand" aria-hidden />,
        remember: query,
      })
    } else if (index.status === "error") {
      message = {
        text: "Não foi possível carregar as sugestões. Você ainda pode pressionar Enter para buscar.",
        tone: "error",
      }
    } else {
      message = { text: "Carregando sugestões…", tone: "info" }
    }
    return { rows, message }
  }, [index, normalized, query, recent])

  const go = (href: string, remember?: string) => {
    if (remember) saveRecent(remember)
    setOpen(false)
    router.push(href)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (active >= 0 && rows[active]) {
      go(rows[active].href, rows[active].remember)
      return
    }
    go(query ? searchHref(query) : "/busca", query || undefined)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false)
      setActive(-1)
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (rows.length === 0) return
      event.preventDefault()
      setOpen(true)
      const down = event.key === "ArrowDown"
      setActive((i) => (i === -1 ? (down ? 0 : rows.length - 1) : (i + (down ? 1 : -1) + rows.length) % rows.length))
    }
  }

  // Keep the arrow-key selection visible inside the scrollable list.
  useEffect(() => {
    if (active >= 0) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" })
    }
  }, [active, listId])

  const showPanel = open && (rows.length > 0 || message !== null)
  const activeId = active >= 0 && rows[active] ? `${listId}-${active}` : undefined
  const heading =
    normalized.length < 2
      ? recent.length > 0
        ? "Buscas recentes e categorias"
        : "Explorar por categoria"
      : "Sugestões"

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <form
        onSubmit={handleSubmit}
        role="search"
        className={cn(
          "flex w-full items-center gap-2 rounded-full border border-border bg-background shadow-lg shadow-foreground/5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
          size === "lg" ? "p-1.5 sm:p-2" : "p-1",
        )}
      >
        <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setActive(-1)
            setOpen(true)
          }}
          onFocus={() => {
            loadSearchIndex()
            setRecent(readRecent())
            setOpen(true)
          }}
          onKeyDown={handleKeyDown}
          type="text"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeId}
          aria-label="O que você está procurando?"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="O que você está procurando?"
          className={cn(
            "w-full min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none",
            size === "lg" ? "text-sm sm:text-base" : "text-sm",
          )}
        />
        {value && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => {
              setValue("")
              setActive(-1)
              rootRef.current?.querySelector("input")?.focus()
            }}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        <Button
          type="submit"
          className={cn(
            "shrink-0 rounded-full active:scale-95",
            size === "lg" ? "px-6" : "px-4 text-xs",
          )}
        >
          Pesquisar
        </Button>
      </form>

      {showPanel && (
        <div
          // keeps the input focused while a suggestion is being clicked
          onMouseDown={(event) => event.preventDefault()}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover p-2 text-left text-popover-foreground shadow-xl shadow-foreground/10"
        >
          {rows.length > 0 && (
            <p className="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {heading}
            </p>
          )}
          <ul
            id={listId}
            role="listbox"
            aria-label="Sugestões de busca"
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
            {rows.map((row, i) => (
              <li
                key={row.key}
                role="presentation"
                className={cn(row.key === "all" && "sticky bottom-0 mt-1 border-t border-border bg-popover pt-1")}
              >
                <Link
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  href={row.href}
                  tabIndex={-1}
                  onClick={() => {
                    if (row.remember) saveRecent(row.remember)
                    setOpen(false)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    i === active ? "bg-accent" : "hover:bg-accent",
                  )}
                >
                  <span className="shrink-0">{row.icon}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{row.label}</span>
                  {row.hint && (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-brand">
                      {row.hint}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {message && (
            <p
              role={message.tone === "error" ? "alert" : "status"}
              className={cn(
                "flex items-center gap-2 px-3 py-3 text-sm",
                message.tone === "error" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {message.tone === "error" ? (
                <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                index.status === "loading" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                )
              )}
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
