"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  const [value, setValue] = useState(defaultValue ?? "")

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const query = value.trim()
    router.push(query ? `/busca?q=${encodeURIComponent(query)}` : "/busca")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-full border border-border bg-background shadow-lg shadow-foreground/5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30",
        size === "lg" ? "p-1.5 sm:p-2" : "p-1",
        className,
      )}
    >
      <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        type="search"
        aria-label="O que você está procurando?"
        enterKeyHint="search"
        placeholder="O que você está procurando?"
        className={cn(
          "w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none",
          size === "lg" ? "text-sm sm:text-base" : "text-sm",
        )}
      />
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
  )
}
