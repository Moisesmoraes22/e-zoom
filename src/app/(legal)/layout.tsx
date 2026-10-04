import { SiteFooter } from "@/components/site-footer"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <article className="container mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-muted-foreground [&_a]:text-brand [&_a]:underline [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-1 [&_p]:mt-3 [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </article>
      <SiteFooter />
    </main>
  )
}
