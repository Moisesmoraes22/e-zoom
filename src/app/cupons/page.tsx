import { createClient } from "@supabase/supabase-js"
import { ExternalLink, Ticket } from "lucide-react"
import type { Metadata } from "next"

import { CopyCodeButton } from "@/components/copy-code-button"
import { SiteFooter } from "@/components/site-footer"
import { formatCurrency, formatDay } from "@/lib/utils"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Cupons do Mercado Livre",
  description: "Cupons de desconto do Mercado Livre ainda válidos, com valor mínimo de compra, desconto máximo e validade.",
}

interface Coupon {
  code: string
  discount_kind: "percent" | "amount"
  discount_value: number
  min_purchase: number | null
  max_discount: number | null
  category: string | null
  expires_at: string | null
  affiliate_url: string | null
}

async function getCoupons(): Promise<Coupon[]> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return []
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } })
  // The database only returns coupons that are still valid (row policy).
  const { data } = await supabase
    .from("coupons")
    .select("code, discount_kind, discount_value, min_purchase, max_discount, category, expires_at, affiliate_url")
    .order("posted_at", { ascending: false })
    .limit(200)
  return (data ?? []) as Coupon[]
}

export default async function CuponsPage() {
  const coupons = await getCoupons()

  return (
    <main id="conteudo" className="min-h-screen bg-background">
      <div className="page-container pt-10">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Cupons do Mercado Livre</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Copie o código e use no carrinho. Cada cupom vale só em produtos elegíveis e enquanto durarem os estoques.
        </p>
      </div>

      {coupons.length > 0 ? (
        <ul className="page-container grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <li key={coupon.code} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold leading-none text-brand">
                    {coupon.discount_kind === "percent" ? `${coupon.discount_value}% OFF` : `${formatCurrency(coupon.discount_value)} OFF`}
                  </p>
                  {coupon.category && <p className="mt-1 text-xs text-muted-foreground">em {coupon.category}</p>}
                </div>
                <Ticket className="h-6 w-6 shrink-0 text-brand" aria-hidden />
              </div>

              <p className="rounded-lg border border-dashed border-border bg-muted px-3 py-2 text-center font-mono text-lg font-bold tracking-wider text-foreground">
                {coupon.code}
              </p>

              <ul className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                {coupon.min_purchase != null && <li>Compra mínima: {formatCurrency(coupon.min_purchase)}</li>}
                {coupon.max_discount != null && <li>Desconto máximo: {formatCurrency(coupon.max_discount)}</li>}
                <li>{coupon.expires_at ? `Válido até ${formatDay(coupon.expires_at)}` : "Validade não informada"}</li>
              </ul>

              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <CopyCodeButton code={coupon.code} />
                {coupon.affiliate_url && (
                  <a
                    href={coupon.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:opacity-90"
                  >
                    Ver produtos
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="page-container py-12 text-muted-foreground">Nenhum cupom válido agora. Volte em instantes.</p>
      )}

      <p className="page-container pb-10 text-xs text-muted-foreground">
        Podemos receber comissão pelas compras feitas pelos links, sem custo extra para você. Confira as regras de cada cupom no Mercado Livre.
      </p>
      <SiteFooter />
    </main>
  )
}
