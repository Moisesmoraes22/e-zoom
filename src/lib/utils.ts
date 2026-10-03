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

export function calculateDiscountPercent(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price) return null
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}
