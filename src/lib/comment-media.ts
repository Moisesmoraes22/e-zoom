export const MAX_PHOTOS = 3
const MAX_SOURCE_BYTES = 10 * 1024 * 1024
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"]

/** Why a chosen file cannot be used, in the visitor's words; null when it is fine. */
export function photoProblem(file: { type: string; size: number }): string | null {
  if (!ACCEPTED.includes(file.type)) return "Use fotos JPG, PNG ou WebP."
  if (file.size > MAX_SOURCE_BYTES) return "Cada foto pode ter até 10 MB."
  return null
}

/**
 * Re-draws the photo as a plain JPEG, at most 1600 px on the long side. Drawing it again drops
 * everything hidden in the file (GPS position, camera and phone data), and the result is small
 * enough for the 2 MB limit of the storage bucket. The bucket accepts nothing but JPEG.
 */
export async function toCleanJpeg(file: File, maxSide = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas")
  context.fillStyle = "#ffffff" // PNG/WebP transparency becomes white instead of black
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
  if (!blob) throw new Error("encode")
  return blob
}
