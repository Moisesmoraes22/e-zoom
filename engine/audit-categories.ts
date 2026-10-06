/**
 * Review of the live catalog's categories. Runs after every collection (GitHub Actions).
 *
 *  1. FIX (with --fix): applies the known title rules (refineCategory) to every active offer
 *     and gives a category to offers that have none, so no source can leave a known mistake.
 *  2. REVIEW: lists offers created in the last --hours (default 24) whose title points to another category
 *     and that no rule covers yet. These are the NEW mistakes: look at them, and for each real
 *     one add a rule in engine/lib/categories.ts plus a row in engine/tests/categories.test.ts.
 *
 *   node --env-file=.env.local engine/audit-categories.ts          (report only)
 *   node --env-file=.env.local engine/audit-categories.ts --fix --hours 24
 */
import { appendFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

import { refineCategory } from "./lib/categories.ts"
import { guessCategory } from "./lib/message-parser.ts"

const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if (!process.env.SUPABASE_URL || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SECRET_KEY")
const supabase = createClient(process.env.SUPABASE_URL, key, { auth: { persistSession: false } })
const fix = process.argv.includes("--fix")
// REVIEW window: only offers created in the last N hours (default 24), so each new offer is looked at once.
const HOURS = Number(process.argv[process.argv.indexOf("--hours") + 1]) || 24

interface Row {
  id: string
  store_id: string
  title: string
  category_slug: string | null
  created_at: string
}
const rows: Row[] = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from("offers")
    .select("id, store_id, title, category_slug, created_at")
    .eq("is_active", true)
    .order("id")
    .range(from, from + 999)
  if (error) throw error
  rows.push(...(data as Row[]))
  if (data.length < 1000) break
}

const lines: string[] = [`## Revisão de categorias (${rows.length} ofertas ativas)`, ""]
const say = (text = "") => lines.push(text)

// 1. known rules + missing categories
const changes = new Map<string, Row[]>()
for (const r of rows) {
  const target = r.category_slug ? refineCategory(r.title, r.category_slug) : guessCategory(r.title)
  if (target && target !== r.category_slug) changes.set(target, [...(changes.get(target) ?? []), r])
}
const toFix = [...changes.values()].reduce((n, list) => n + list.length, 0)
say(`**Correções automáticas:** ${toFix}${fix ? " (aplicadas)" : " (simulação, use --fix)"}`)
for (const [target, list] of changes) {
  say(`- ${list.length} para \`${target}\`: ${list.slice(0, 3).map((r) => r.title.slice(0, 40)).join(" · ")}`)
}
if (fix) {
  for (const [target, list] of changes) {
    for (let i = 0; i < list.length; i += 200) {
      const { error } = await supabase.from("offers").update({ category_slug: target }).in("id", list.slice(i, i + 200).map((r) => r.id))
      if (error) throw error
    }
  }
}

// 2. new offers whose title disagrees with the category and no rule covers
const since = Date.now() - HOURS * 3_600_000
const fixedIds = new Set([...changes.values()].flat().map((r) => r.id))
const suspects = rows.filter((r) => {
  if (Date.parse(r.created_at) < since || fixedIds.has(r.id) || !r.category_slug) return false
  const guess = guessCategory(r.title)
  return guess !== null && guess !== r.category_slug
})
const without = rows.filter((r) => !r.category_slug && !fixedIds.has(r.id))
say("")
say(`**Para revisar (ofertas das últimas ${HOURS}h em que o título aponta outra categoria):** ${suspects.length}`)
for (const r of suspects.slice(0, 30)) say(`- [${r.category_slug} → ${guessCategory(r.title)}?] (${r.store_id}) ${r.title.slice(0, 80)}`)
if (suspects.length > 30) say(`- ... e mais ${suspects.length - 30}`)
say("")
say(`**Sem categoria:** ${without.length}`)
for (const r of without.slice(0, 10)) say(`- (${r.store_id}) ${r.title.slice(0, 80)}`)

const report = lines.join("\n")
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`)
