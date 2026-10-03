"use client"

import type { AnchorHTMLAttributes } from "react"

import type { Product, StoreSource } from "@/lib/types"

interface OfferLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  product: Pick<Product, "id" | "title">
  store: StoreSource
  affiliateUrl: string
}

/**
 * Centralized affiliate CTA. Every "Ver oferta" click in the app should go
 * through here so click tracking (product, store, origin) can be wired up
 * in one place later, without touching every call site. Not implemented
 * yet — no fake analytics.
 */
export function OfferLink({
  product: _product,
  store: _store,
  affiliateUrl,
  onClick,
  ...rest
}: OfferLinkProps) {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (event) => {
    // TODO: register { productId: _product.id, store: _store, origin } once
    // an analytics/attribution backend exists.
    void _product
    void _store
    onClick?.(event)
  }

  return (
    <a
      href={affiliateUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      {...rest}
    />
  )
}
