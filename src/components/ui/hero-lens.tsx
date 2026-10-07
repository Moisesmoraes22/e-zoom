"use client"

import { useEffect, useRef } from "react"

import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

const ZOOM = 1.35
const RADIUS = 150

/** Two rows of real offers sliding in opposite directions; each row is doubled for a seamless loop. */
function Rows({ products }: { products: Product[] }) {
  const half = Math.ceil(products.length / 2)
  const rows = [products.slice(0, half), products.slice(half)]
  return (
    <div className="absolute -inset-8 flex -rotate-[5deg] scale-[1.08] flex-col justify-center gap-4">
      {rows.map((row, r) => (
        <div key={r} className={r === 0 ? "lens-row" : "lens-row lens-row-rev"}>
          {[...row, ...row].map((product, i) => (
            <div key={`${product.id}-${i}`} className="w-[196px] shrink-0">
              <ProductCard product={product} compact />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Background of the desktop hero: the offers pass underneath, dimmed. A magnifying glass
 * wanders over them (or follows the pointer) and shows the same cards sharp, 35% bigger and
 * clickable. Only mounted on desktop, so phones never download any of it.
 */
export function HeroLens({ products }: { products: Product[] }) {
  const box = useRef<HTMLDivElement>(null)
  const zoom = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const hint = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = box.current
    const layer = zoom.current
    const glass = ring.current
    if (!el || !layer || !glass) return
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    let target: { x: number; y: number } | null = null
    let cx = 0
    let cy = 0
    let started = false
    let visible = true
    let clock = 0
    let last = performance.now()
    let raf = 0
    layer.inert = true // keyboard users get the same offers from the strip below the hero

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      target = { x: e.clientX - r.left, y: e.clientY - r.top }
      layer.inert = false
      if (hint.current) hint.current.style.opacity = "0"
    }
    const onLeave = () => {
      target = null
      layer.inert = true
    }

    const frame = (now: number) => {
      if (!visible || document.hidden) return
      const r = el.getBoundingClientRect()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const hold = layer.matches(":hover")
      el.classList.toggle("lens-hold", hold)
      let x: number
      let y: number
      if (target) {
        ;({ x, y } = target)
      } else if (reduce) {
        x = r.width * 0.5
        y = r.height * 0.5
      } else {
        clock += dt
        x = r.width * 0.5 + Math.sin(clock * 0.4) * r.width * 0.22
        y = r.height * 0.5 + Math.cos(clock * 0.55) * r.height * 0.26
      }
      if (!started) {
        cx = x
        cy = y
        started = true
      }
      const k = 1 - Math.pow(0.0008, dt) // easing: the glass follows with a little inertia
      cx += (x - cx) * k
      cy += (y - cy) * k
      layer.style.transformOrigin = `${cx}px ${cy}px`
      layer.style.transform = `scale(${ZOOM})`
      layer.style.clipPath = `circle(${RADIUS / ZOOM}px at ${cx}px ${cy}px)`
      glass.style.left = `${cx}px`
      glass.style.top = `${cy}px`
      raf = requestAnimationFrame(frame)
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) {
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
    })
    observer.observe(el)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [])

  return (
    <div ref={box} className="absolute inset-0">
      <div aria-hidden inert className="pointer-events-none absolute inset-0 [filter:blur(1.5px)_brightness(.55)_saturate(.85)]">
        <Rows products={products} />
      </div>
      <div ref={zoom} className="absolute inset-0 will-change-[transform,clip-path] [clip-path:circle(0_at_0_0)]">
        <Rows products={products} />
      </div>
      <div ref={ring} aria-hidden className="lens-ring" />
      <div
        ref={hint}
        aria-hidden
        className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[13px] font-semibold text-[#13264f] shadow-lg transition-opacity duration-500"
      >
        <span className="h-2 w-2 rounded-full bg-primary" />
        Passe o mouse para dar zoom nas ofertas
      </div>
    </div>
  )
}
