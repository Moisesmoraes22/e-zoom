/**
 * Many brand searches: collected once a day by their own workflow (engine-nichos.yml), not in every
 * 30 minute run. Shared by the connectors (what the regular run skips) and by the run (how long their
 * offers may go unseen before they are switched off).
 */
export const DAILY_NICHES = new Set([
  "perfumes",
  "livros",
  "instrumentos",
  "dermocosmeticos",
  "ervas-naturais",
  "joias-relogios",
  "beleza",
  "animais",
  "higiene-cuidados",
  "bebes",
  "saude",
  "placas-de-video",
])
