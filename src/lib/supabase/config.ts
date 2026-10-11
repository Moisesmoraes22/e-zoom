/** False when the two public variables were not provided at build time (the site then runs as visitor-only). */
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)

/** Cookie of a stored session (@supabase/ssr names it sb-<project>-auth-token, in chunks when long). */
export const hasSessionCookie = () =>
  typeof document !== "undefined" && /(?:^|;\s*)sb-[^=]+-auth-token/.test(document.cookie)
