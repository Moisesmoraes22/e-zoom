"use client"

import { createContext, useContext, type ReactNode } from "react"

/**
 * The name of the list (vitrine) a card is shown in: "destaques", "baixou", "vistos"... It goes with
 * each exibição and click, so each list can be measured on its own. Outside a named list the page
 * area is used ("busca", "categoria", "produto").
 */
const ShelfContext = createContext("")

export function Shelf({ name, children }: { name: string; children: ReactNode }) {
  return <ShelfContext.Provider value={name}>{children}</ShelfContext.Provider>
}

export const useShelf = () => useContext(ShelfContext)
