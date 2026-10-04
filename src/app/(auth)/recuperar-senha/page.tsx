import type { Metadata } from "next"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-ui"
import { RecoverForm } from "@/components/auth/recover-form"

export const metadata: Metadata = { title: "Recuperar senha" }

export default async function RecuperarSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams

  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe o e-mail da sua conta e enviaremos as instruções."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <RecoverForm notice={erro === "link" ? "O link expirou. Peça um novo abaixo." : undefined} />
    </AuthCard>
  )
}
