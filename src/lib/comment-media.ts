import { scrubMp4 } from "@/lib/mp4-clean"

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

export const MAX_VIDEO_SECONDS = 20
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024
const VIDEO_TYPES = ["video/mp4", "video/quicktime"]

/** Why a chosen video cannot be used, in the visitor's words; null when it is fine so far. */
export function videoProblem(file: { type: string; size: number }): string | null {
  if (!VIDEO_TYPES.includes(file.type)) return "Use vídeo em MP4 ou MOV."
  if (file.size > MAX_VIDEO_BYTES) return "O vídeo pode ter até 15 MB."
  return null
}

/** Length in seconds as the browser reads it; null when this browser cannot play the file. */
export function videoSeconds(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    const done = (value: number | null) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    video.preload = "metadata"
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) ? video.duration : null)
    video.onerror = () => done(null)
    video.src = url
  })
}

/** The video bytes with the location and device data of the file erased; null if it is not MP4/MOV. */
export async function toCleanVideo(file: File): Promise<Blob | null> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  return scrubMp4(bytes) ? new Blob([bytes], { type: "video/mp4" }) : null
}
