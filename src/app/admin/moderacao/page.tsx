import { Eye, EyeOff, Trash2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

import { deleteComment, setCommentStatus } from "./actions"

export const metadata: Metadata = { title: "Moderação", robots: { index: false, follow: false } }

const REASONS: Record<string, string> = {
  ofensivo: "Ofensivo",
  spam: "Spam",
  conteudo_improprio: "Conteúdo impróprio",
  outro: "Outro",
}

interface Row {
  id: string
  author_name: string
  body: string
  status: "visible" | "hidden"
  reports_count: number
  created_at: string
  offers: { id: string; title: string } | null
  comment_media: { path: string }[]
  comment_reports: { reason: string }[]
}

const SELECT =
  "id, author_name, body, status, reports_count, created_at, offers(id, title), comment_media(path), comment_reports(reason)"

export default async function ModeracaoPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams
  const all = ver === "todos"

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims) redirect("/login?next=/admin/moderacao")
  // Only admins see the page; everyone else gets the same 404 as a page that does not exist.
  const { data: admin } = await supabase.from("admins").select("user_id").maybeSingle()
  if (!admin) notFound()

  const query = supabase.from("comments").select(SELECT).order("created_at", { ascending: false }).limit(100)
  const { data } = await (all ? query : query.or("status.eq.hidden,reports_count.gt.0"))
  const rows = (data ?? []) as unknown as Row[]
  const photoUrl = (path: string) => supabase.storage.from("comment-media").getPublicUrl(path).data.publicUrl

  const tab = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors",
      active ? "border-primary bg-primary/10 text-brand" : "border-border text-foreground hover:bg-accent/40",
    )

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <div className="page-container py-10">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Moderação de comentários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Denunciados e ocultos aparecem na fila. Com 3 denúncias o comentário sai do ar sozinho.
        </p>

        <nav className="mt-5 flex gap-2" aria-label="Filtro">
          <Link href="/admin/moderacao" className={tab(!all)}>Fila</Link>
          <Link href="/admin/moderacao?ver=todos" className={tab(all)}>Todos (100 mais recentes)</Link>
        </nav>

        {rows.length === 0 ? (
          <p className="mt-10 text-muted-foreground">{all ? "Nenhum comentário ainda." : "Fila vazia. Nada a revisar."}</p>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{row.author_name}</span>
                  <time dateTime={row.created_at}>
                    {new Date(row.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                  </time>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium",
                      row.status === "hidden" ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success",
                    )}
                  >
                    {row.status === "hidden" ? "Oculto" : "Visível"}
                  </span>
                  {row.reports_count > 0 && (
                    <span>
                      {row.reports_count} {row.reports_count === 1 ? "denúncia" : "denúncias"}
                    </span>
                  )}
                </div>

                {row.offers && (
                  <Link href={`/produto/${row.offers.id}`} className="mt-2 block text-sm font-medium text-brand hover:underline">
                    {row.offers.title}
                  </Link>
                )}

                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{row.body}</p>

                {row.comment_media.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {row.comment_media.map((m) => (
                      <a key={m.path} href={photoUrl(m.path)} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- user photo, already resized by the uploader */}
                        <img
                          src={photoUrl(m.path)}
                          alt="Foto do comentário"
                          loading="lazy"
                          className="h-24 w-24 rounded-lg border border-border object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {row.comment_reports.length > 0 && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Motivos: {row.comment_reports.map((r) => REASONS[r.reason] ?? r.reason).join(", ")}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={setCommentStatus}>
                    <input type="hidden" name="id" value={row.id} />
                    <input type="hidden" name="status" value={row.status === "hidden" ? "visible" : "hidden"} />
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                    >
                      {row.status === "hidden" ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
                      {row.status === "hidden" ? "Restaurar" : "Ocultar"}
                    </button>
                  </form>
                  <form action={deleteComment}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-destructive/40 px-4 text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
