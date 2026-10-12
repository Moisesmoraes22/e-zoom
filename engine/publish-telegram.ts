// Posts new price drops to the Telegram channel (Bot API). Runs after each collection.
//   node --env-file=.env.local --import ./engine/tests/alias.mjs engine/publish-telegram.ts
// Needs SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_PUBLISHABLE_KEY, TELEGRAM_BOT_TOKEN and
// TELEGRAM_POST_CHAT (@channel or -100...). TELEGRAM_POST_DRY_RUN=1 prints instead of posting.
// Without the bot variables it exits quietly (the job is optional).
import { createClient } from "@supabase/supabase-js"

import { getCatalog } from "../src/lib/offers.ts"
import { darkPhotos } from "../src/lib/photo-check.ts"
import { isQuietHour, pickPosts, POST_DEFAULTS, postCaption, productUrl } from "./lib/telegram-post.ts"

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezooom.com.br"
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_POST_CHAT: chat, SUPABASE_URL } = process.env
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const dryRun = process.env.TELEGRAM_POST_DRY_RUN === "1"

if (!token || !chat) {
  console.log("TELEGRAM_BOT_TOKEN / TELEGRAM_POST_CHAT ausentes: nada a publicar.")
  process.exit(0)
}
if (!SUPABASE_URL || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY")
  process.exit(1)
}
const now = Date.now()
if (isQuietHour(now) && process.env.TELEGRAM_POST_FORCE !== "1") {
  console.log("Horário de silêncio (23h às 7h em Brasília): nada publicado.")
  process.exit(0)
}

const supabase = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
const dayStart = new Date(Math.floor((now - 3 * 3_600_000) / 86_400_000) * 86_400_000 + 3 * 3_600_000).toISOString()
const dayAgo = new Date(now - 24 * 3_600_000).toISOString()

const [{ data: today, error: todayError }, { data: recent, error: recentError }] = await Promise.all([
  supabase.from("telegram_posts").select("id").gte("posted_at", dayStart),
  supabase.from("telegram_posts").select("offer_id").gte("posted_at", dayAgo),
])
if (todayError || recentError) {
  console.error("Falha ao ler telegram_posts:", (todayError ?? recentError)!.message)
  process.exit(1)
}
const room = POST_DEFAULTS.maxPerDay - (today?.length ?? 0)
if (room <= 0) {
  console.log(`Limite do dia atingido (${POST_DEFAULTS.maxPerDay}).`)
  process.exit(0)
}

const { products, live } = await getCatalog()
if (!live) {
  console.error("Catálogo ao vivo indisponível: nada foi publicado.")
  process.exit(1)
}
const posted = new Set((recent ?? []).map((r) => r.offer_id as string))
const candidates = pickPosts(products, posted, now, { maxPerRun: POST_DEFAULTS.maxPerRun + 3 })
// Mostly black photos read as a hole in the feed: the next offer in line takes the place.
const dark = await darkPhotos(candidates.map((p) => p.image))
const picks = candidates.filter((p) => !dark.has(p.image)).slice(0, Math.min(POST_DEFAULTS.maxPerRun, room))

if (picks.length === 0) {
  console.log("Nenhuma queda nova para publicar.")
  process.exit(0)
}

async function telegram(method: string, body: object) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null
  return { ok: Boolean(json?.ok), error: json?.description ?? `HTTP ${res.status}` }
}

let sent = 0
for (const p of picks) {
  const caption = postCaption(p)
  const url = productUrl(SITE, p)
  if (dryRun) {
    console.log(`--- ${p.id}\n${caption}\n${url}\n`)
    continue
  }
  const markup = { inline_keyboard: [[{ text: "Ver oferta", url }]] }
  let result = await telegram("sendPhoto", { chat_id: chat, photo: p.image, caption, parse_mode: "HTML", reply_markup: markup })
  if (!result.ok) {
    // Photo refused (format, size, host): the text alone still announces the drop.
    result = await telegram("sendMessage", {
      chat_id: chat,
      text: caption,
      parse_mode: "HTML",
      reply_markup: markup,
      link_preview_options: { is_disabled: true },
    })
  }
  if (!result.ok) {
    console.error(`Falhou ${p.id}: ${result.error}`)
    continue
  }
  const { error } = await supabase.from("telegram_posts").insert({ offer_id: p.id, price: p.price })
  if (error) console.error(`Publicado, mas não registrado (${p.id}): ${error.message}`)
  sent++
  await new Promise((resolve) => setTimeout(resolve, 1500)) // the Bot API allows ~20 messages a minute to one channel
}
console.log(`${dryRun ? "Simulado" : "Publicado"}: ${dryRun ? picks.length : sent} de ${picks.length}.`)
