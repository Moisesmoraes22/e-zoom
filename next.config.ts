import type { NextConfig } from "next";

// What the browser may receive: the project URL and the PUBLISHABLE key (public by design,
// limited by RLS). Set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to
// use the standard names; otherwise the existing server variables are reused, so no new
// environment variable has to be configured.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

/** Stops the build if the value that would reach the browser is a secret/service-role key. */
function assertNotSecret(value: string | undefined) {
  if (!value) return;
  let isSecret = value.startsWith("sb_secret_");
  const parts = value.split(".");
  if (parts.length === 3) {
    try {
      const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
      isSecret ||= claims.role === "service_role";
    } catch {
      // not a JWT: nothing more to check
    }
  }
  if (isSecret) {
    throw new Error("Refusing to build: a secret/service-role key was mapped to the browser.");
  }
}
assertNotSecret(url);
assertNotSecret(key);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  },
};

export default nextConfig;
