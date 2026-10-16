"use client"

import type { AnchorHTMLAttributes } from "react"

import { areaOf, positionBucket } from "@/lib/impressions"
import { recordProduct } from "@/lib/interest-profile"
import { useShelf } from "@/lib/shelf"
import type { Product, StoreSource } from "@/lib/types"

interface OfferLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  product: Pick<Product, "id" | "title" | "category">
  store: StoreSource
  affiliateUrl: string
  /** Place of the card in its list (1 = first), when it is in one. */
  position?: number
}

/** Counts a click on an offer (profile + popularity). sendBeacon survives the page being left for the store. */
export function recordOfferClick(product: Pick<Product, "id" | "title" | "category">, shelf = "", position?: number) {
  recordProduct("click", product)
  const origin = areaOf(window.location.pathname)
  const payload = JSON.stringify({ offerId: product.id, origin, shelf: shelf || origin, position: positionBucket(position) })
  if (!navigator.sendBeacon?.("/api/click", new Blob([payload], { type: "application/json" }))) {
    void fetch("/api/click", { method: "POST", body: payload, keepalive: true }).catch(() => {})
  }
}

/**
 * Centralized affiliate CTA. Every "Ver oferta" click in the app goes through here,
 * which records it (offer + site area, nothing about the visitor) for the popularity
 * sections. sendBeacon survives the page being left for the store.
 */
export function OfferLink({
  product,
  store: _store,
  affiliateUrl,
  position,
  onClick,
  onAuxClick,
  ...rest
}: OfferLinkProps) {
  void _store // part of the call sites' API; kept out of the <a> props
  const shelf = useShelf()
  const record = () => recordOfferClick(product, shelf, position)
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    record()
    onClick?.(event)
  }
  // Middle click (opens in a new tab) does not fire onClick.
  const handleAuxClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.button === 1) record()
    onAuxClick?.(event)
  }

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      {...rest}
    />
  )
}
