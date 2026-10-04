"use client"

import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Labelled input. The error is tied to the field (aria-describedby) and has an icon, so color is never the only cue. */
export function Field({
  label,
  type = "text",
  value,
  onChange,
  error,
  hint,
  autoComplete,
  inputMode,
  maxLength,
  revealable = false,
}: {
  label: string
  type?: "text" | "email" | "password"
  value: string
  onChange: (value: string) => void
  error?: string | null
  hint?: string
  autoComplete: string
  inputMode?: "email" | "text"
  maxLength?: number
  revealable?: boolean
}) {
  const id = useId()
  const [shown, setShown] = useState(false)
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ")

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={revealable && shown ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          // iOS only: no auto-capitalisation/correction on credentials
          autoCapitalize="none"
          spellCheck={false}
          className={cn(
            "h-11 w-full rounded-lg border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
            revealable && "pr-11",
            error ? "border-destructive" : "border-input",
          )}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={shown}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {shown ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

/** Form-level result. Errors are announced at once (role=alert); success politely (role=status). */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : CheckCircle2
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        tone === "error"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-primary/40 bg-primary/10 text-brand",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}

export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" size="lg" disabled={busy} aria-busy={busy} className="h-11 w-full gap-2">
      {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}

/** Centered, compact card used by every account screen. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-lg font-semibold text-transparent">
          HibridLink
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  )
}
