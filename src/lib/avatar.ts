export const AVATAR_BUCKET = "avatars"
export const AVATAR_SIZE = 256
export const MIN_NAME = 2
export const MAX_NAME = 60

const PUBLIC_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/${AVATAR_BUCKET}/`

/**
 * The profile photo URL from the user's metadata, only when it points into OUR avatars bucket.
 * Metadata is writable by the user, so anything else (another site, a tracking pixel) is ignored.
 */
export function safeAvatarUrl(value: unknown): string | null {
  return typeof value === "string" && PUBLIC_PREFIX.length > 40 && value.startsWith(PUBLIC_PREFIX) ? value : null
}

/** The storage path (<user_id>/<file>.jpg) of one of our avatar URLs, to delete the old photo. */
export const avatarPath = (url: string) => (url.startsWith(PUBLIC_PREFIX) ? url.slice(PUBLIC_PREFIX.length) : null)

/** Why a name cannot be saved, in the visitor's words; null when it is fine. */
export function nameProblem(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < MIN_NAME) return "Digite seu nome."
  if (trimmed.length > MAX_NAME) return `Use até ${MAX_NAME} caracteres.`
  return null
}

/**
 * Centre-crops the photo to a square and re-draws it as a 256 px JPEG (about 20-40 KB). Drawing it again
 * drops everything hidden in the file (GPS position, camera and phone data).
 */
export async function toAvatarJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2
  const canvas = document.createElement("canvas")
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas")
  context.fillStyle = "#ffffff" // PNG/WebP transparency becomes white instead of black
  context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE)
  context.drawImage(bitmap, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85))
  if (!blob) throw new Error("encode")
  return blob
}
