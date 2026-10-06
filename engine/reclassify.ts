/**
 * Gives a category to active offers that have none, using the same title rules the
 * Telegram connector applies to new posts. Run it after changing those rules.
 *
 *   node --env-file=.env.local engine/reclassify.ts          (dry run: prints counts)
 *   node --env-file=.env.local engine/reclassify.ts --write
 */
import { createClient } from "@supabase/supabase-js"

import { guessCategory } from "./lib/message-parser.ts"

const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!process.env.SUPABASE_URL || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY")
const supabase = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false } })

const { data, error } = await supabase
  .from("offers")
  .select("id, title")
  .eq("is_active", true)
  .is("category_slug", null)
  .limit(2000)
if (error) throw error

const changes = new Map<string, string[]>()
const left: string[] = []
for (const o of data) {
  const slug = guessCategory(o.title)
  if (slug) changes.set(slug, [...(changes.get(slug) ?? []), o.id])
  else left.push(o.title)
}
for (const [slug, ids] of changes) console.log(`${slug}: ${ids.length}`)
console.log(`sem categoria (continuam): ${left.length}`)
left.slice(0, 15).forEach((t) => console.log(`  - ${t.slice(0, 70)}`))

if (!process.argv.includes("--write")) {
  console.log("\nSimulação: nada foi gravado. Use --write para salvar.")
} else {
  for (const [slug, ids] of changes) {
    const { error: e } = await supabase.from("offers").update({ category_slug: slug }).in("id", ids)
    if (e) throw e
  }
  console.log("gravado.")
}
