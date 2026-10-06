"use client"

import type { AnchorHTMLAttributes } from "react"

import type { Product, StoreSource } from "@/lib/types"

interface OfferLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  product: Pick<Product, "id" | "title">
  store: StoreSource
  affiliateUrl: string
}

/** Site area of the current page, as stored with each click. */
const originOf = (pathname: string) => {
  const area = pathname.split("/")[1] ?? ""
  return area === "" ? "home" : ["busca", "categoria", "produto"].includes(area) ? area : "outro"
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
  onClick,
  onAuxClick,
  ...rest
}: OfferLinkProps) {
  void _store // part of the call sites' API; kept out of the <a> props
  const record = () => {
    const payload = JSON.stringify({ offerId: product.id, origin: originOf(window.location.pathname) })
    if (!navigator.sendBeacon?.("/api/click", new Blob([payload], { type: "application/json" }))) {
      void fetch("/api/click", { method: "POST", body: payload, keepalive: true }).catch(() => {})
    }
  }
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
