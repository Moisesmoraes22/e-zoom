import { createClient } from "@supabase/supabase-js"
import { Api, TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"

import { parseCoupons } from "./lib/coupon-parser.ts"

// Reads the Mercado Livre affiliate channel (private invite link in TELEGRAM_COUPON_INVITE) and
// keeps the `coupons` table up to date. The collector's account must already be a member:
// this script never joins on its own.
const { SUPABASE_URL, TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_SESSION, TELEGRAM_COUPON_INVITE, ML_AFFILIATE_URL_TEMPLATE } = process.env
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const dry = process.argv.includes("--dry") // lê e mostra, sem gravar
if ((!dry && (!SUPABASE_URL || !serviceKey)) || !TELEGRAM_API_ID || !TELEGRAM_API_HASH || !TELEGRAM_SESSION || !TELEGRAM_COUPON_INVITE) {
  console.error("Faltam SUPABASE_URL / SUPABASE_SECRET_KEY / TELEGRAM_API_ID / TELEGRAM_API_HASH / TELEGRAM_SESSION / TELEGRAM_COUPON_INVITE")
  process.exit(1)
}

/**
 * The channel's short links carry the channel owner's affiliate tag. Read where they point,
 * keep only the page (no query string) and wrap it with OUR affiliate template.
 */
async function ownLink(shortLink: string | null): Promise<string | null> {
  if (!shortLink || !ML_AFFILIATE_URL_TEMPLATE) return null
  try {
    const response = await fetch(shortLink, { redirect: "manual", signal: AbortSignal.timeout(8000) })
    const target = new URL(response.headers.get("location") ?? shortLink)
    if (!target.hostname.endsWith("mercadolivre.com.br")) return null
    return ML_AFFILIATE_URL_TEMPLATE.replace("{url}", `${target.origin}${target.pathname}`)
  } catch {
    return null
  }
}

const client = new TelegramClient(new StringSession(TELEGRAM_SESSION), Number(TELEGRAM_API_ID), TELEGRAM_API_HASH, { connectionRetries: 3 })
await client.connect()
try {
  const invite = await client.invoke(new Api.messages.CheckChatInvite({ hash: TELEGRAM_COUPON_INVITE }))
  if (invite.className !== "ChatInviteAlready") throw new Error("A conta do coletor não está no canal de cupons; entre nele uma vez antes de rodar.")
  const messages = await client.getMessages(invite.chat, { limit: Number(process.env.TELEGRAM_COUPON_MESSAGES) || 100 })

  // Newest first: when a code is posted again, the latest post wins.
  const rows = new Map<string, Record<string, unknown>>()
  for (const message of messages) {
    if (!message.message) continue
    const postedAt = new Date(message.date * 1000)
    for (const coupon of parseCoupons(message.message, postedAt)) {
      if (rows.has(coupon.code)) continue
      if (coupon.expires_at && Date.parse(coupon.expires_at) < Date.now()) continue
      const { link, kind, value, ...rest } = coupon
      rows.set(coupon.code, {
        ...rest,
        discount_kind: kind,
        discount_value: value,
        affiliate_url: await ownLink(link),
        posted_at: postedAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  if (dry) {
    for (const r of rows.values()) console.log(JSON.stringify({ ...r, affiliate_url: r.affiliate_url ? "(link próprio ok)" : null }))
  } else if (rows.size) {
    const supabase = createClient(SUPABASE_URL!, serviceKey!, { auth: { persistSession: false } })
    const { error } = await supabase.from("coupons").upsert([...rows.values()], { onConflict: "code" })
    if (error) throw error
  }
  console.log(`[cupons] ${messages.length} mensagens lidas, ${rows.size} cupons${dry ? " (simulação, nada gravado)" : " gravados"}`)
} finally {
  await client.disconnect()
}
process.exit(0)
