import { createClient } from "@supabase/supabase-js"

import { createMercadoLivreConnector } from "./connectors/mercadolivre.ts"
import { createShopeeConnector } from "./connectors/shopee.ts"
import { createTelegramConnector } from "./connectors/telegram.ts"
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
    const offers = await connector.fetchOffers()
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

    // Offers that left the channels stop showing after a 48h grace period.
    // Skipped on empty runs so a Telegram outage can't wipe the catalog.
    if (offers.length > 0) {
      const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString()
      const { error } = await supabase
        .from("offers")
        .update({ is_active: false })
        .in("source", [...new Set(offers.map((o) => o.source))])
        .eq("is_active", true)
        .lt("last_seen_at", cutoff)
      if (error) throw error
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
