"use client"

import { useState } from "react"

import { Field, FormMessage, SubmitButton } from "@/components/auth/auth-ui"
import { RATE_LIMITED, isEmail } from "@/lib/auth/validate"
import { createClient } from "@/lib/supabase/client"

export function RecoverForm({ notice }: { notice?: string }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(notice ?? null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    setFormError(null)
    if (!isEmail(email)) {
      setError("Digite um e-mail válido.")
      return
    }
    setError(undefined)
    setBusy(true)
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/redefinir-senha`,
    })
    setBusy(false)
    // The answer is the same whether or not the address has an account (no enumeration);
    // only a rate limit is reported, because it does not depend on the address.
    if (resetError && (resetError.status === 429 || resetError.code?.includes("rate_limit"))) {
      setFormError(RATE_LIMITED)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <FormMessage tone="success">
        Se existir uma conta associada a este e-mail, você receberá as instruções para criar uma
        nova senha.
      </FormMessage>
    )
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
        error={error}
      />
      <SubmitButton busy={busy}>{busy ? "Enviando…" : "Enviar instruções"}</SubmitButton>
    </form>
  )
}
