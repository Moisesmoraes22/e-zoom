"use client"

import { MailCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Field, FormMessage, SubmitButton } from "@/components/auth/auth-ui"
import { isEmail, passwordProblem, signUpMessage } from "@/lib/auth/validate"
import { createClient } from "@/lib/supabase/client"

export function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (busy) return
    const trimmedName = name.trim()
    const nextErrors = {
      name: trimmedName.length >= 2 ? undefined : "Digite seu nome.",
      email: isEmail(email) ? undefined : "Digite um e-mail válido.",
      password: passwordProblem(password) ?? undefined,
      confirm: confirm === password ? undefined : "As senhas não são iguais.",
    }
    setErrors(nextErrors)
    setFormError(null)
    if (Object.values(nextErrors).some(Boolean)) return

    setBusy(true)
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: trimmedName },
        // PKCE: the confirmation link comes back here with a one-time code
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/conta`,
      },
    })
    setBusy(false)
    if (error) {
      setFormError(signUpMessage(error))
      return
    }
    // Only a real session means the account is already usable (project with e-mail
    // confirmation off). Otherwise, success just means "e-mail sent": never "verified".
    if (data.session) {
      router.push("/conta")
      router.refresh()
      return
    }
    setSentTo(email.trim())
  }

  if (sentTo) {
    return (
      <div className="flex flex-col items-center gap-3 text-center" role="status">
        <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-brand">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">Verifique seu e-mail</h2>
        <p className="text-sm text-muted-foreground">
          Se o endereço <strong className="text-foreground">{sentTo}</strong> puder ser usado, você
          receberá um link para confirmar a conta. Depois de confirmar, é só entrar.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-brand hover:underline">
          Ir para o login
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && <FormMessage tone="error">{formError}</FormMessage>}
      <Field label="Nome" autoComplete="name" value={name} onChange={setName} error={errors.name} maxLength={80} />
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
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        hint="Pelo menos 8 caracteres, com letras e números."
        revealable
      />
      <Field
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        error={errors.confirm}
        revealable
      />
      <SubmitButton busy={busy}>{busy ? "Criando conta…" : "Criar conta"}</SubmitButton>
    </form>
  )
}
