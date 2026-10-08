"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

const BUCKET = "comment-media"
const VIDEO_BUCKET = "comment-videos"

/**
 * Both actions run with the admin's own session: the database policies (public.admins) decide.
 * A visitor who is not an admin changes 0 rows, whatever is posted here.
 */
export async function setCommentStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const status = formData.get("status") === "visible" ? "visible" : "hidden"
  const supabase = await createClient()
  // Restoring also clears the report counter, otherwise the next single report would hide it again.
  await supabase.from("comments").update(status === "visible" ? { status, reports_count: 0 } : { status }).eq("id", id)
  revalidatePath("/admin/moderacao")
}

export async function deleteComment(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const supabase = await createClient()
  const { data: media } = await supabase.from("comment_media").select("path, kind").eq("comment_id", id)
  const pathsOf = (kind: string) => (media ?? []).filter((m) => m.kind === kind).map((m) => m.path)
  if (pathsOf("photo").length) await supabase.storage.from(BUCKET).remove(pathsOf("photo"))
  if (pathsOf("video").length) await supabase.storage.from(VIDEO_BUCKET).remove(pathsOf("video"))
  await supabase.from("comments").delete().eq("id", id)
  revalidatePath("/admin/moderacao")
}
