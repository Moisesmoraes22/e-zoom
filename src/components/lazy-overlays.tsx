"use client"

import dynamic from "next/dynamic"

// Neither is visible on first paint (the sheet is closed, flights only happen on a tap), so their
// code loads after the page is interactive instead of inside the first JavaScript.
const FavoritesSheet = dynamic(() => import("@/components/favorites-sheet").then((m) => m.FavoritesSheet))
const FavoritesFlightLayer = dynamic(() =>
  import("@/components/favorites-flight-layer").then((m) => m.FavoritesFlightLayer),
)

export function LazyOverlays() {
  return (
    <>
      <FavoritesSheet />
      <FavoritesFlightLayer />
    </>
  )
}
