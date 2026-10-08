/**
 * "Leaked password" check without the paid Supabase feature, using the free Pwned Passwords service
 * (haveibeenpwned.com) the same way. Only the FIRST 5 characters of the password's SHA-1 leave the
 * browser (k-anonymity); the password itself never does, and the service cannot tell which of the
 * hundreds of matching hashes is ours. Runs in the browser, before sign-up and password reset.
 */

/** The answer is one "SUFFIX:COUNT" line per hash. Padding lines (COUNT 0) are fake and ignored. */
export function suffixInRange(body: string, suffix: string): boolean {
  const wanted = suffix.toUpperCase()
  return body.split(/\r?\n/).some((line) => {
    const [found, count] = line.trim().split(":")
    return found?.toUpperCase() === wanted && Number(count) > 0
  })
}

/**
 * True when the password is known from data leaks. When the check cannot run (offline, service down,
 * slow), it says false: a broken third-party service must never block anyone from creating an account.
 */
export async function isLeakedPassword(password: string): Promise<boolean> {
  try {
    const bytes = new TextEncoder().encode(password)
    const digest = await crypto.subtle.digest("SHA-1", bytes)
    const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase()
    const response = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    })
    if (!response.ok) return false
    return suffixInRange(await response.text(), hash.slice(5))
  } catch {
    return false
  }
}

export const LEAKED_PASSWORD_MESSAGE = "Essa senha já apareceu em vazamentos de dados. Escolha outra."
