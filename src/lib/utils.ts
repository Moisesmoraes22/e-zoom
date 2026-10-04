import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/** "2318" -> "2,3 mil" · "540" -> "540" */
export function formatReviewCount(count: number) {
  if (count < 1000) return `${count}`
  return `${(count / 1000).toFixed(1).replace(".", ",")} mil`
}

/** "2026-10-04T03:12:00Z" -> "04/10, 00:12" (fixed timezone so server and client agree). */
export function formatSeenAt(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso))
}

/** "há 8 min" · "há 3 h" · "há 2 dias". Time-dependent: render it on the client only. */
export function formatTimeAgo(iso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return "agora"
  if (minutes < 60) return `há ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours} h`
  const days = Math.floor(hours / 24)
  return `há ${days} ${days === 1 ? "dia" : "dias"}`
}

export function calculateDiscountPercent(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}
