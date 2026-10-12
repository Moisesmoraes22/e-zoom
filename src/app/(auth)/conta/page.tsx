import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AuthCard } from "@/components/auth/auth-ui"
import { OpenFavoritesButton, SignOutButton } from "@/components/auth/account-actions"
import { ProfileEditor } from "@/components/auth/profile-editor"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Minha conta" }

export default async function ContaPage() {
  const supabase = await createClient()
  // Server-side identity check: the signature of the token is verified. (The proxy also
  // redirects, but a page must not rely on that alone.)
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) redirect("/login?next=/conta")

  // RLS returns only this user's rows; no user id is sent.
  const { count } = await supabase.from("favorites").select("*", { count: "exact", head: true })
  const metadataName = (claims.user_metadata as { full_name?: string } | undefined)?.full_name
  const saved = count ?? 0

  return (
    <AuthCard title="Minha conta">
      <ProfileEditor initialName={metadataName ?? ""} email={claims.email ?? ""} />

      <hr className="my-6 border-border" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">Favoritos</p>
          <p className="text-sm text-muted-foreground">
            {saved} {saved === 1 ? "oferta salva" : "ofertas salvas"} na conta
          </p>
        </div>
        <OpenFavoritesButton />
      </div>

      <hr className="my-6 border-border" />

      <SignOutButton />
    </AuthCard>
  )
}
