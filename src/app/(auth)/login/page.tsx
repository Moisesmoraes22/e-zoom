import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-ui"
import { LoginForm } from "@/components/auth/login-form"
import { safeNext } from "@/lib/auth/validate"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Entrar" }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>
}) {
  const { next, erro } = await searchParams
  const target = safeNext(next, "/")

  // Already signed in: nothing to do here. getClaims() verifies the token's signature.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect(target)

  return (
    <AuthCard
      title="Entre na sua conta"
      description="Sincronize seus favoritos entre seus dispositivos."
      footer={
        <>
          Ainda não tenho uma conta{" "}
          <Link href="/cadastro" className="font-semibold text-brand hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm
        next={target}
        notice={erro === "link" ? "O link é inválido ou expirou. Tente entrar ou peça um novo." : undefined}
      />
    </AuthCard>
  )
}
