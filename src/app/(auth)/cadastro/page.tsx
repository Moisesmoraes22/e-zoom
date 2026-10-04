import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-ui"
import { SignUpForm } from "@/components/auth/signup-form"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Criar conta" }

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect("/conta")

  return (
    <AuthCard
      title="Crie sua conta"
      description="Opcional: você pode usar o HibridLink e favoritar sem conta."
      footer={
        <>
          Já tenho uma conta{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  )
}
