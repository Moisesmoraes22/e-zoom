// Client-side checks for a better form. They are NOT the security boundary: Supabase
// Auth validates e-mail and enforces its own password rules again on the server.

export const MIN_PASSWORD = 8

export const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) && value.trim().length <= 254

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `Use pelo menos ${MIN_PASSWORD} caracteres.`
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Misture letras e números."
  return null
}

type AuthErrorLike = { code?: string; status?: number; message?: string } | null

const RATE_LIMITED = "Muitas tentativas. Aguarde alguns minutos e tente de novo."

/** Messages never say whether an e-mail has an account (except after a correct password). */
export function loginMessage(error: AuthErrorLike): string {
  if (error?.code === "invalid_credentials") return "E-mail ou senha incorretos."
  if (error?.code === "email_not_confirmed")
    return "Confirme seu e-mail antes de entrar. Procure o link que enviamos."
  if (error?.status === 429 || error?.code?.includes("rate_limit")) return RATE_LIMITED
  return "Não foi possível entrar agora. Tente novamente."
}

export function signUpMessage(error: AuthErrorLike): string {
  if (error?.code === "weak_password") return "Essa senha é fraca. Misture letras e números e use 8 ou mais caracteres."
  if (error?.status === 429 || error?.code?.includes("rate_limit"))
    return "Muitos pedidos agora. Aguarde alguns minutos e tente de novo."
  return "Não foi possível criar a conta agora. Tente novamente."
}

export function resetPasswordMessage(error: AuthErrorLike): string {
  if (error?.code === "same_password") return "A nova senha precisa ser diferente da atual."
  if (error?.code === "weak_password") return "Essa senha é fraca. Misture letras e números e use 8 ou mais caracteres."
  if (error?.status === 401 || error?.code === "session_not_found" || error?.code === "no_authorization")
    return "O link expirou. Peça um novo em “Esqueci minha senha”."
  return "Não foi possível alterar a senha agora. Tente novamente."
}

export { RATE_LIMITED }

/** Only follow same-site relative paths after login (blocks open redirects). */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback
  return next
}
