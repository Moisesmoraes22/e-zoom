import type { OfferRow } from "../types.ts"

export interface Blocked {
  store_id: string
  external_id: string
}

const keyOf = (o: Blocked) => `${o.store_id}:${o.external_id}`

/**
 * Drops the offers listed in `blocked_offers` (table in the database). To block one:
 *   insert into blocked_offers (store_id, external_id, reason) values ('amazon', 'B0XXXXXXXX', 'why');
 * It disappears from the site at the next run and is never collected again.
 */
export function withoutBlocked<T extends Pick<OfferRow, "store_id" | "external_id">>(offers: T[], blocked: Blocked[]) {
  const set = new Set(blocked.map(keyOf))
  return offers.filter((o) => !set.has(keyOf(o)))
}
