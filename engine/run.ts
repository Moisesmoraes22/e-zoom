import { createClient } from "@supabase/supabase-js"

import { createMercadoLivreConnector } from "./connectors/mercadolivre.ts"
import { createShopeeConnector } from "./connectors/shopee.ts"
import { createTelegramConnector } from "./connectors/telegram.ts"
import { withoutBlocked } from "./lib/blocklist.ts"
import { summarizeDropped, withoutProhibited } from "./lib/title-rules.ts"
import { DAILY_NICHES } from "./lib/daily-niches.ts"
import type { Connector } from "./types.ts"

const CONNECTORS: Record<string, (env: NodeJS.ProcessEnv) => Connector> = {
  mercadolivre: createMercadoLivreConnector,
  shopee: createShopeeConnector,
  telegram: createTelegramConnector,
}

async function main() {
  const name = process.argv[2]
  const factory = name ? CONNECTORS[name] : undefined
  if (!factory) {
    console.error(`Usage: run.ts <${Object.keys(CONNECTORS).join("|")}>`)
    process.exit(1)
  }

  // New-style `sb_secret_...` keys (SUPABASE_SECRET_KEY) win over the legacy service_role one.
  const { SUPABASE_URL } = process.env
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !serviceKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY")
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  })
  const connector = factory(process.env)

  const { data: run, error: runError } = await supabase
    .from("ingest_runs")
    .insert({ source: connector.name })
    .select("id")
    .single()
  if (runError) throw runError

  try {
    // Blocked offers (table `blocked_offers`) are never saved, and are switched off if already live.
    const { data: blockedRows, error: blockedError } = await supabase.from("blocked_offers").select("store_id, external_id")
    if (blockedError) throw blockedError
    const blocked = blockedRows ?? []
    // Titles the affiliate terms or the owner rule out (used items, hookahs, sweets...) are never saved.
    const { kept: offers, dropped } = withoutProhibited(withoutBlocked(await connector.fetchOffers(), blocked))
    if (dropped.length > 0) console.log(`[${connector.name}] left out by title rules: ${summarizeDropped(dropped)}`)
    for (const b of blocked) {
      await supabase.from("offers").update({ is_active: false }).eq("store_id", b.store_id).eq("external_id", b.external_id).eq("is_active", true)
    }
    const now = new Date().toISOString()

    // Upsert in chunks; the DB trigger records price_history on price change.
    let upserted = 0
    for (let i = 0; i < offers.length; i += 100) {
      const chunk = offers
        .slice(i, i + 100)
        .map(({ seen_at, ...offer }) => ({ ...offer, is_active: true, last_seen_at: seen_at ?? now }))
      const { error } = await supabase
        .from("offers")
        .upsert(chunk, { onConflict: "store_id,external_id" })
      if (error) throw error
      upserted += chunk.length
    }

    // Offers that left the source stop showing after a grace period without being seen. The stores' own
    // lists are walked every 30 minutes, so 24 h is plenty. The daily niches are walked once a day (and a
    // scheduled run can start late), so they keep 48 h: a 24 h limit would switch them off for a while each
    // day. Telegram prices are the post's and Amazon moves them several times a day, but the Telegram channel
    // is the only source of Amazon offers: at 24h the store nearly vanished from the site, so it keeps 48 h too.
    // Skipped on empty runs so a Telegram outage can't wipe the catalog.
    if (offers.length > 0) {
      // Only the stores this run brought: the Shopee and Mercado Livre APIs share source "api".
      const stores = [...new Set(offers.map((o) => o.store_id))]
      const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString()
      const niches = [...DAILY_NICHES]
      for (const source of new Set(offers.map((o) => o.source))) {
        const live = () =>
          supabase.from("offers").update({ is_active: false }).eq("source", source).in("store_id", stores).eq("is_active", true)
        const long = 48
        const short = source === "api" ? 24 : 48 // Telegram (Amazon): see above
        // Not a daily niche (or no category at all): the short limit.
        const regular = await live()
          .lt("last_seen_at", hoursAgo(short))
          .or(`category_slug.is.null,category_slug.not.in.(${niches.join(",")})`)
        if (regular.error) throw regular.error
        // A daily niche: the long limit.
        const daily = await live().lt("last_seen_at", hoursAgo(long)).in("category_slug", niches)
        if (daily.error) throw daily.error
      }
    }

    await supabase
      .from("ingest_runs")
      .update({
        status: "ok",
        finished_at: new Date().toISOString(),
        items_found: offers.length,
        items_upserted: upserted,
      })
      .eq("id", run.id)
    console.log(`[${connector.name}] ${upserted} offers upserted`)
  } catch (error) {
    await supabase
      .from("ingest_runs")
      .update({
        status: "error",
        finished_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      })
      .eq("id", run.id)
    throw error
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error)
  process.exit(1)
})
