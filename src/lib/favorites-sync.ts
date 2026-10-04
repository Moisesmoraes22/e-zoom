import type { Product } from "@/lib/types"

// No runtime imports on purpose: this is the merge logic, and it can be checked
// with plain `node` against a fake API (see the checks in the PR notes).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Only real offers (UUIDs) can live in an account; sample-data ids stay on the device. */
export const isOfferId = (id: string) => UUID.test(id)

/** The few operations the merge needs from the account store. Any of them may throw. */
export interface FavoritesApi {
  listIds(): Promise<string[]>
  /** Must be idempotent: ids already saved are ignored, not duplicated. */
  addMany(ids: string[]): Promise<void>
  removeOne(id: string): Promise<void>
  /** Active offers by id (inactive ones are simply not returned). */
  loadOffers(ids: string[]): Promise<Product[]>
}

export interface SyncResult {
  /** Account-only favorites to add to the device list. */
  loaded: Product[]
  /** Every id that is now confirmed in the account. */
  accountIds: Set<string>
}

/**
 * Safe union of the device favorites and the account favorites.
 *
 * Order: retry earlier failed removals, read the account, upload what the account
 * lacks and read it back to confirm, load what the device lacks. Nothing local is ever removed or replaced here:
 * the caller applies the result only after this resolves, and keeps the device list
 * untouched if it throws (network, session, partial failure).
 *
 * Running it again changes nothing (the upload is idempotent and the lists are sets).
 */
export async function syncFavorites(
  api: FavoritesApi,
  local: Product[],
  pendingRemovals: Set<string>,
): Promise<SyncResult> {
  for (const id of pendingRemovals) await api.removeOne(id)
  pendingRemovals.clear()

  const remoteIds = (await api.listIds()).filter((id) => !pendingRemovals.has(id))
  const remote = new Set(remoteIds)
  const localIds = new Set(local.map((p) => p.id))

  const toUpload = [...localIds].filter((id) => isOfferId(id) && !remote.has(id))
  let confirmed = remoteIds
  if (toUpload.length > 0) {
    await api.addMany(toUpload)
    // A resolved insert is not enough: read the account back and require every id.
    confirmed = (await api.listIds()).filter((id) => !pendingRemovals.has(id))
    const now = new Set(confirmed)
    if (toUpload.some((id) => !now.has(id))) throw new Error("favorites upload not confirmed")
  }

  const toLoad = remoteIds.filter((id) => !localIds.has(id))
  const loaded = toLoad.length > 0 ? await api.loadOffers(toLoad) : []

  return { loaded, accountIds: new Set(confirmed) }
}

/** Device list after a successful sync: everything local, plus the account-only offers. */
export function mergeLoaded(local: Product[], loaded: Product[]): Product[] {
  const have = new Set(local.map((p) => p.id))
  return [...local, ...loaded.filter((p) => !have.has(p.id))]
}
