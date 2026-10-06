"use client"

import { Bookmark, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/lib/favorites-context"

export function OpenFavoritesButton() {
  const { openFavorites } = useFavorites()
  return (
    <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={openFavorites}>
      <Bookmark className="h-4 w-4" aria-hidden />
      Ver favoritos
    </Button>
  )
}

/** Really ends the session: the refresh token is revoked and the cookies are cleared. */
export function SignOutButton() {
  const { signOut } = useAuth()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      className="w-full gap-2"
      onClick={async () => {
        setBusy(true)
        await signOut()
        router.push("/")
        router.refresh()
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? "Saindo…" : "Sair"}
    </Button>
  )
}
