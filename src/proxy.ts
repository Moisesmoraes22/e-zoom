import type { NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

// Account routes only. Public pages (/, /busca, /categorias, /produto/...) never run
// this, so they stay statically cached and carry no session cookies or private data.
export const config = {
  matcher: ["/conta/:path*", "/login", "/cadastro", "/recuperar-senha", "/redefinir-senha", "/auth/:path*"],
}
