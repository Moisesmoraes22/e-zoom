"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Field, FormMessage, SubmitButton } from "@/components/auth/auth-ui"
import { passwordProblem, resetPasswordMessage } from "@/lib/auth/validate"
import { createClient } from "@/lib/supabase/client"

/** Shown only with the short session that the e-mailed recovery link creates. */
export function ResetPasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const nextErrors = {
      password: passwordProblem(password) ?? undefined,
      confirm: confirm === password ? undefined : "As senhas não são iguais.",
    }
    setErrors(nextErrors)
    setFormError(null)
    if (nextErrors.password || nextErrors.confirm) return

    setBusy(true)
    const { error } = await createClient().auth.updateUser({ password })
    if (error) {
      setFormError(resetPasswordMessage(error))
      setBusy(false)
      return
    }
    router.push("/conta")
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && <FormMessage tone="error">{formError}</FormMessage>}
      <Field
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        hint="Pelo menos 8 caracteres, com letras e números."
        revealable
      />
      <Field
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
        revealable
      />
      <SubmitButton busy={busy}>{busy ? "Salvando…" : "Salvar nova senha"}</SubmitButton>
    </form>
  )
}
