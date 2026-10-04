import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-ui"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Nova senha" }

export default async function RedefinirSenhaPage() {
  // Only reachable with the session created by the recovery link in the e-mail.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect("/recuperar-senha?erro=link")

  return (
    <AuthCard title="Crie uma nova senha" description="Escolha uma senha que você não use em outros sites.">
      <ResetPasswordForm />
    </AuthCard>
  )
}
