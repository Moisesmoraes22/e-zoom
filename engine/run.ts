import { createClient } from "@supabase/supabase-js"

import { createMercadoLivreConnector } from "./connectors/mercadolivre.ts"
import { createShopeeConnector } from "./connectors/shopee.ts"
import { createTelegramConnector } from "./connectors/telegram.ts"
import { withoutBlocked } from "./lib/blocklist.ts"
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
    const offers = withoutBlocked(await connector.fetchOffers(), blocked)
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

    // Offers that left the source stop showing after a grace period. Telegram prices are
    // the post's, and Amazon moves them several times a day: 24h. APIs re-read every run: 48h.
    // Skipped on empty runs so a Telegram outage can't wipe the catalog.
    if (offers.length > 0) {
      // Only the stores this run brought: the Shopee and Mercado Livre APIs share source "api".
      const stores = [...new Set(offers.map((o) => o.store_id))]
      for (const source of new Set(offers.map((o) => o.source))) {
        const hours = source === "telegram" ? 24 : 48
        const cutoff = new Date(Date.now() - hours * 3600_000).toISOString()
        const { error } = await supabase
          .from("offers")
          .update({ is_active: false })
          .eq("source", source)
          .in("store_id", stores)
          .eq("is_active", true)
          .lt("last_seen_at", cutoff)
        if (error) throw error
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
