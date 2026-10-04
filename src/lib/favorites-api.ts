"use client"

import type { FavoritesApi } from "@/lib/favorites-sync"
import { OFFER_COLUMNS, rowToProduct, type OfferRow } from "@/lib/offer-row"
import { createClient } from "@/lib/supabase/client"

/**
 * Account favorites over the browser client. Authorization is not decided here:
 * the policies on public.favorites only ever let a user see and change their own rows,
 * and user_id is filled in by the database from the session, never sent by us.
 */
export function createFavoritesApi(): FavoritesApi {
  const supabase = createClient()

  return {
    async listIds() {
      const { data, error } = await supabase.from("favorites").select("offer_id")
      if (error) throw error
      return (data ?? []).map((row) => row.offer_id as string)
    },

    async addMany(ids) {
      // ON CONFLICT DO NOTHING on (user_id, offer_id): saving twice is a no-op.
      const { error } = await supabase
        .from("favorites")
        .upsert(
          ids.map((offer_id) => ({ offer_id })),
          { onConflict: "user_id,offer_id", ignoreDuplicates: true },
        )
      if (error) throw error
    },

    async removeOne(id) {
      // RLS limits this to the caller's own row, whatever id is sent.
      const { error } = await supabase.from("favorites").delete().eq("offer_id", id)
      if (error) throw error
    },

    async loadOffers(ids) {
      const { data, error } = await supabase.from("offers").select(OFFER_COLUMNS).in("id", ids)
      if (error) throw error
      return ((data ?? []) as OfferRow[]).map((row) => rowToProduct(row))
    },
  }
}
