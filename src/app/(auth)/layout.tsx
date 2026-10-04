import type { Metadata } from "next"

import { SiteFooter } from "@/components/site-footer"

// Account screens are private and personal: kept out of search engines and the sitemap.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-screen bg-background">
      {children}
      <SiteFooter />
    </main>
  )
}
