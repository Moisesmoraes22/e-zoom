import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Browser copies of two server variables that already exist (same values, no new
  // env vars to configure). ONLY the project URL and the publishable key, which are
  // public by design and protected by RLS. Never map SUPABASE_SECRET_KEY here.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  },
};

export default nextConfig;
