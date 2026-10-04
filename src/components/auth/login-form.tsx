"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Field, FormMessage, SubmitButton } from "@/components/auth/auth-ui"
import { isEmail, loginMessage } from "@/lib/auth/validate"
import { createClient } from "@/lib/supabase/client"

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string | null>(notice ?? null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const nextErrors = {
      email: isEmail(email) ? undefined : "Digite um e-mail válido.",
      password: password ? undefined : "Digite sua senha.",
    }
    setErrors(nextErrors)
    setFormError(null)
    if (nextErrors.email || nextErrors.password) return

    setBusy(true)
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setFormError(loginMessage(error))
      setBusy(false)
      return
    }
    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && <FormMessage tone="error">{formError}</FormMessage>}
      <Field
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
      />
      <Field
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        revealable
      />
      <SubmitButton busy={busy}>{busy ? "Entrando…" : "Entrar"}</SubmitButton>
      <Link
        href="/recuperar-senha"
        className="self-center rounded-md text-sm font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Esqueci minha senha
      </Link>
    </form>
  )
}
