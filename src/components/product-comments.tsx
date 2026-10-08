"use client"

import { Camera, Flag, Loader2, MessageSquare, Trash2, Video, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { MAX_PHOTOS, MAX_VIDEO_SECONDS, photoProblem, toCleanJpeg, toCleanVideo, videoProblem, videoSeconds } from "@/lib/comment-media"
import { createClient, supabaseConfigured } from "@/lib/supabase/client"
import { formatSeenAt } from "@/lib/utils"

const BUCKET = "comment-media"
const VIDEO_BUCKET = "comment-videos"
const MAX_BODY = 1000

interface CommentRow {
  id: string
  user_id: string
  author_name: string
  body: string
  created_at: string
  comment_media: { path: string; kind: "photo" | "video" }[]
}

const REPORT_REASONS = [
  { value: "ofensivo", label: "Ofensivo" },
  { value: "spam", label: "Spam ou propaganda" },
  { value: "conteudo_improprio", label: "Conteúdo impróprio" },
  { value: "outro", label: "Outro motivo" },
] as const

/**
 * Comments from signed-in buyers, with up to 3 photos and 1 video. Everything that matters is enforced by
 * the database (policies, limits, who the author is); this component only reads and writes
 * through the visitor's own session. Public pages stay static: the list loads after the page.
 */
export function ProductComments({ offerId }: { offerId: string }) {
  const auth = useAuth()
  const supabase = useMemo(() => (supabaseConfigured ? createClient() : null), [])
  const [comments, setComments] = useState<CommentRow[] | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)

  const load = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase
      .from("comments")
      .select("id, user_id, author_name, body, created_at, comment_media(path, kind)")
      .eq("offer_id", offerId)
      .order("created_at", { ascending: false })
      .limit(30)
    if (error) {
      setLoadFailed(true)
      return
    }
    setLoadFailed(false)
    setComments((data ?? []) as CommentRow[])
  }, [supabase, offerId])

  useEffect(() => {
    // Defer the fetch out of the effect body so state is not set synchronously during render.
    const id = setTimeout(load, 0)
    return () => clearTimeout(id)
  }, [load])

  if (!supabase) return null

  const mediaUrl = (media: { path: string; kind: "photo" | "video" }) =>
    supabase.storage.from(media.kind === "video" ? VIDEO_BUCKET : BUCKET).getPublicUrl(media.path).data.publicUrl

  return (
    <section aria-labelledby="comentarios" className="rounded-2xl border border-border bg-card p-5">
      <h2 id="comentarios" className="flex items-center gap-2 text-lg font-semibold text-foreground">
        <MessageSquare className="h-5 w-5 text-brand" aria-hidden />
        Comentários de compradores
      </h2>

      {auth.status === "authenticated" ? (
        <CommentForm offerId={offerId} userId={auth.user.id} onSent={load} />
      ) : auth.status === "anonymous" ? (
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-brand hover:underline">
            Entre
          </Link>{" "}
          ou{" "}
          <Link href="/cadastro" className="font-semibold text-brand hover:underline">
            crie uma conta
          </Link>{" "}
          para comentar e enviar fotos e vídeo.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-4">
        {loadFailed && <p className="text-sm text-muted-foreground">Não foi possível carregar os comentários agora.</p>}
        {comments === null && !loadFailed && <p className="text-sm text-muted-foreground">Carregando comentários…</p>}
        {comments?.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há comentários. Seja o primeiro.</p>}
        {comments?.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            mediaUrl={mediaUrl}
            ownerId={auth.status === "authenticated" ? auth.user.id : null}
            onChanged={load}
          />
        ))}
      </div>
    </section>
  )
}

function CommentForm({ offerId, userId, onSent }: { offerId: string; userId: string; onSent: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])
  const videoPreview = useMemo(() => (video ? URL.createObjectURL(video) : null), [video])
  useEffect(() => () => { if (videoPreview) URL.revokeObjectURL(videoPreview) }, [videoPreview])

  const pickVideo = async (list: FileList | null) => {
    const file = list?.[0]
    if (videoInput.current) videoInput.current.value = ""
    if (!file) return
    const problem = videoProblem(file)
    if (problem) return setMessage(problem)
    const seconds = await videoSeconds(file)
    if (seconds === null) return setMessage("Este navegador não consegue ler esse vídeo. Tente outro arquivo.")
    if (seconds > MAX_VIDEO_SECONDS) return setMessage(`O vídeo pode ter até ${MAX_VIDEO_SECONDS} segundos.`)
    setMessage(null)
    setVideo(file)
  }

  const pick = (list: FileList | null) => {
    if (!list) return
    const chosen = [...files]
    for (const file of Array.from(list)) {
      const problem = photoProblem(file)
      if (problem) {
        setMessage(problem)
        continue
      }
      if (chosen.length >= MAX_PHOTOS) {
        setMessage(`No máximo ${MAX_PHOTOS} fotos por comentário.`)
        break
      }
      chosen.push(file)
    }
    setFiles(chosen)
    if (input.current) input.current.value = ""
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (text.length < 3) {
      setMessage("Escreva pelo menos 3 letras.")
      return
    }
    setBusy(true)
    setMessage(null)
    const uploaded: string[] = []
    const uploadedVideos: string[] = []
    try {
      for (const file of files) {
        const blob = await toCleanJpeg(file)
        const path = `${userId}/${crypto.randomUUID()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
        if (error) throw error
        uploaded.push(path)
      }
      if (video) {
        const clean = await toCleanVideo(video)
        if (!clean) {
          setMessage("Esse arquivo não parece ser um vídeo MP4 ou MOV.")
          if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded)
          return
        }
        const path = `${userId}/${crypto.randomUUID()}.mp4`
        const { error } = await supabase.storage.from(VIDEO_BUCKET).upload(path, clean, { contentType: "video/mp4" })
        if (error) throw error
        uploadedVideos.push(path)
      }
      const { data, error } = await supabase.from("comments").insert({ offer_id: offerId, body: text }).select("id").single()
      if (error) throw error
      const media = [
        ...uploaded.map((path) => ({ comment_id: data.id, path, kind: "photo" })),
        ...uploadedVideos.map((path) => ({ comment_id: data.id, path, kind: "video" })),
      ]
      if (media.length) {
        const { error: mediaError } = await supabase.from("comment_media").insert(media)
        if (mediaError) setMessage("O comentário foi enviado, mas as fotos ou o vídeo não puderam ser anexados.")
      }
      setBody("")
      setFiles([])
      setVideo(null)
      onSent()
    } catch (error) {
      if (uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded)
      if (uploadedVideos.length) await supabase.storage.from(VIDEO_BUCKET).remove(uploadedVideos)
      const text = error instanceof Error ? error.message : ""
      setMessage(
        text.includes("comment_rate_limit")
          ? "Você já enviou 5 comentários na última hora. Tente de novo mais tarde."
          : "Não foi possível enviar agora. Tente novamente.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <label htmlFor="comentario-texto" className="sr-only">
        Seu comentário
      </label>
      <textarea
        id="comentario-texto"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        maxLength={MAX_BODY}
        rows={3}
        placeholder="Conte como foi sua experiência com este produto ou vendedor."
        className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {previews.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <li key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${i + 1} escolhida`} className="h-20 w-20 rounded-lg border border-border object-cover" />
              <button
                type="button"
                aria-label={`Remover foto ${i + 1}`}
                onClick={() => setFiles(files.filter((_, k) => k !== i))}
                className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {videoPreview && (
        <div className="relative w-fit">
          <video src={videoPreview} controls muted playsInline preload="metadata" className="max-h-40 rounded-lg border border-border" />
          <button
            type="button"
            aria-label="Remover vídeo"
            onClick={() => setVideo(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input ref={videoInput} type="file" accept="video/mp4,video/quicktime" hidden onChange={(e) => pickVideo(e.target.files)} />
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => pick(e.target.files)} />
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => input.current?.click()} disabled={busy || files.length >= MAX_PHOTOS}>
          <Camera className="h-4 w-4" aria-hidden />
          Adicionar foto
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => videoInput.current?.click()} disabled={busy || video !== null}>
          <Video className="h-4 w-4" aria-hidden />
          Adicionar vídeo
        </Button>
        <Button type="submit" size="sm" className="gap-1.5 rounded-full" disabled={busy || body.trim().length < 3}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Enviar comentário
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">{body.length}/{MAX_BODY}</span>
      </div>
      {message && (
        <p role="status" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Seja respeitoso e não publique dados pessoais. As fotos são reenviadas sem a localização e o vídeo (MP4 ou MOV, até 20 s e 15 MB) tem a localização apagada do arquivo. Ao enviar, você aceita os{" "}
        <Link href="/termos" className="underline">
          Termos de Uso
        </Link>
        . Comentários denunciados por várias pessoas saem do ar.
      </p>
    </form>
  )
}

function CommentItem({
  comment,
  mediaUrl,
  ownerId,
  onChanged,
}: {
  comment: CommentRow
  mediaUrl: (media: { path: string; kind: "photo" | "video" }) => string
  ownerId: string | null
  onChanged: () => void
}) {
  const supabase = useMemo(() => createClient(), [])
  const [reporting, setReporting] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const own = ownerId === comment.user_id

  const remove = async () => {
    if (!window.confirm("Excluir este comentário?")) return
    const pathsOf = (kind: "photo" | "video") => comment.comment_media.filter((m) => m.kind === kind).map((m) => m.path)
    if (pathsOf("photo").length) await supabase.storage.from(BUCKET).remove(pathsOf("photo"))
    if (pathsOf("video").length) await supabase.storage.from(VIDEO_BUCKET).remove(pathsOf("video"))
    const { error } = await supabase.from("comments").delete().eq("id", comment.id)
    if (error) setNote("Não foi possível excluir agora.")
    else onChanged()
  }

  const report = async (reason: (typeof REPORT_REASONS)[number]["value"]) => {
    const { error } = await supabase.from("comment_reports").insert({ comment_id: comment.id, reason })
    setReporting(false)
    setNote(error?.code === "23505" ? "Você já denunciou este comentário." : error ? "Não foi possível denunciar agora." : "Obrigado. Vamos analisar.")
  }

  return (
    <article className="rounded-xl border border-border p-4">
      <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <strong className="text-foreground">{comment.author_name}</strong>
        <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
          {formatSeenAt(comment.created_at)}
        </time>
      </header>
      <p className="mt-2 whitespace-pre-line break-words text-sm text-foreground">{comment.body}</p>
      {comment.comment_media.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {comment.comment_media.map((media) => (
            <li key={media.path}>
              {media.kind === "video" ? (
                <video src={mediaUrl(media)} controls playsInline preload="none" className="max-h-64 max-w-full rounded-lg border border-border" />
              ) : (
                <a href={mediaUrl(media)} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(media)} alt={`Foto enviada por ${comment.author_name}`} loading="lazy" className="h-24 w-24 rounded-lg border border-border object-cover" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
      <footer className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {own && (
          <button type="button" onClick={remove} className="flex cursor-pointer items-center gap-1 hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Excluir
          </button>
        )}
        {!own && ownerId && !reporting && (
          <button type="button" onClick={() => setReporting(true)} className="flex cursor-pointer items-center gap-1 hover:text-foreground">
            <Flag className="h-3.5 w-3.5" aria-hidden />
            Denunciar
          </button>
        )}
        {reporting && (
          <span className="flex flex-wrap items-center gap-2">
            Motivo:
            {REPORT_REASONS.map((reason) => (
              <button key={reason.value} type="button" onClick={() => report(reason.value)} className="cursor-pointer rounded-full border border-border px-2.5 py-1 hover:bg-accent">
                {reason.label}
              </button>
            ))}
            <button type="button" onClick={() => setReporting(false)} className="cursor-pointer underline">
              Cancelar
            </button>
          </span>
        )}
        {note && <span role="status">{note}</span>}
      </footer>
    </article>
  )
}
