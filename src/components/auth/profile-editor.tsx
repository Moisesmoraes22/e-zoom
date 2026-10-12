"use client"

import { Camera, Loader2, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Avatar } from "@/components/avatar"
import { Field, FormMessage } from "@/components/auth/auth-ui"
import { Button } from "@/components/ui/button"
import { photoProblem } from "@/lib/comment-media"
import { AVATAR_BUCKET, avatarPath, MAX_NAME, nameProblem, toAvatarJpeg } from "@/lib/avatar"
import { createClient } from "@/lib/supabase/client"

type Notice = { tone: "error" | "success"; text: string } | null

/**
 * Profile photo and name. The photo is cropped and re-drawn in the browser, stored in the user's own
 * folder of the avatars bucket and linked in the user's metadata; the name is metadata too. The
 * header and this card follow the signed-in user, so both update as soon as the change is saved.
 */
export function ProfileEditor({ initialName, email }: { initialName: string; email: string }) {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(initialName)
  const [nameError, setNameError] = useState<string | null>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [nameBusy, setNameBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const shownName = user?.name ?? initialName
  const avatarUrl = user?.avatarUrl ?? null

  /** Removes the previous photo file; a failure only leaves an orphan file, never blocks the change. */
  const dropOld = async (oldUrl: string | null, userId: string) => {
    const path = oldUrl ? avatarPath(oldUrl) : null
    if (path && path.startsWith(`${userId}/`)) {
      await createClient().storage.from(AVATAR_BUCKET).remove([path])
    }
  }

  const choosePhoto = async (file: File | undefined) => {
    if (!file || !user || photoBusy) return
    const problem = photoProblem(file)
    if (problem) return setNotice({ tone: "error", text: problem })
    setPhotoBusy(true)
    setNotice(null)
    try {
      const supabase = createClient()
      const jpeg = await toAvatarJpeg(file)
      const path = `${user.id}/${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, jpeg, { contentType: "image/jpeg", cacheControl: "31536000" })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } })
      if (error) throw error
      await dropOld(avatarUrl, user.id)
      setNotice({ tone: "success", text: "Foto atualizada." })
    } catch {
      setNotice({ tone: "error", text: "Não foi possível salvar a foto agora. Tente outra imagem ou tente de novo." })
    } finally {
      setPhotoBusy(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const removePhoto = async () => {
    if (!user || !avatarUrl || photoBusy) return
    setPhotoBusy(true)
    setNotice(null)
    try {
      const { error } = await createClient().auth.updateUser({ data: { avatar_url: null } })
      if (error) throw error
      await dropOld(avatarUrl, user.id)
      setNotice({ tone: "success", text: "Foto removida." })
    } catch {
      setNotice({ tone: "error", text: "Não foi possível remover a foto agora. Tente de novo." })
    } finally {
      setPhotoBusy(false)
    }
  }

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault()
    if (nameBusy) return
    const problem = nameProblem(name)
    setNameError(problem)
    if (problem) return
    setNameBusy(true)
    setNotice(null)
    const { error } = await createClient().auth.updateUser({ data: { full_name: name.trim().replace(/\s+/g, " ") } })
    setNameBusy(false)
    if (error) return setNotice({ tone: "error", text: "Não foi possível salvar o nome agora. Tente de novo." })
    setName(name.trim().replace(/\s+/g, " "))
    setNotice({ tone: "success", text: "Nome atualizado." })
  }

  const unchanged = name.trim().replace(/\s+/g, " ") === shownName

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <Avatar url={avatarUrl} label={shownName || email} className="h-20 w-20 text-3xl" />
        <div className="flex min-w-0 flex-col items-start gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-label="Escolher foto de perfil"
            onChange={(event) => void choosePhoto(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={photoBusy || !user}
            aria-busy={photoBusy}
            className="gap-2"
            onClick={() => fileRef.current?.click()}
          >
            {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
            {avatarUrl ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {avatarUrl && (
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => void removePhoto()}
              className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Remover foto
            </button>
          )}
        </div>
      </div>

      <form onSubmit={saveName} className="flex flex-col gap-3" noValidate>
        <Field
          label="Nome"
          value={name}
          onChange={(value) => {
            setName(value)
            setNameError(null)
          }}
          error={nameError}
          autoComplete="name"
          maxLength={MAX_NAME + 10}
        />
        <Button type="submit" size="lg" disabled={nameBusy || unchanged} aria-busy={nameBusy} className="h-11 w-full gap-2">
          {nameBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar nome
        </Button>
      </form>

      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}

      <div className="text-sm">
        <p className="text-muted-foreground">E-mail</p>
        <p className="mt-0.5 break-all font-medium text-foreground">{email}</p>
      </div>
    </div>
  )
}
