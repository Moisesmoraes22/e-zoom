"use client"

import { useEffect, useRef } from "react"

type RGB = [number, number, number]

/** "#rgb" / "#rrggbb" (what the theme tokens hold) -> [r, g, b]. */
function parse(hex: string, fallback: RGB): RGB {
  const h = hex.trim().replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  if (!/^[0-9a-f]{6}$/i.test(full)) return fallback
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)]
}
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`

interface Palette {
  deep: RGB // --band: the darkest tone
  bright: RGB // --primary
  soft: RGB // --accent: the light wash
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  return {
    deep: parse(css.getPropertyValue("--band"), [19, 38, 90]),
    bright: parse(css.getPropertyValue("--primary"), [47, 100, 200]),
    soft: parse(css.getPropertyValue("--accent"), [219, 230, 251]),
  }
}

interface Bokeh {
  x: number // 0..1 across the width
  y: number // 0..1 down the height
  r: number // radius, px
  speed: number // screens per second, upwards
  phase: number
}

function makeBokeh(w: number): Bokeh[] {
  const n = w < 640 ? 10 : 22
  return Array.from({ length: n }, (_, i) => ({
    x: 0.3 + 0.7 * ((i * 0.6180339) % 1), // golden-ratio spread, leaning to the right
    y: (i * 0.4142) % 1,
    r: 6 + ((i * 7) % 13),
    speed: 0.012 + ((i * 3) % 7) * 0.003,
    phase: i * 1.7,
  }))
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: RGB, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, rgba(color, alpha))
  g.addColorStop(1, rgba(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

/**
 * One frame. `t` is in seconds. The scene: two slow glows, three overlapping curved slabs
 * that sway (navy to blue, like folded panels), a thin light edge on each, and soft bokeh
 * drifting up. `k` scales everything down on narrow screens, where the text covers the width.
 */
function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  pal: Palette,
  bokeh: Bokeh[],
  pointer: { x: number; y: number },
) {
  const k = w >= 1024 ? 1 : w >= 640 ? 0.55 : 0.35
  ctx.clearRect(0, 0, w, h)

  glow(ctx, w * (0.8 + 0.03 * Math.sin(t * 0.17)), h * (0.15 + 0.06 * Math.cos(t * 0.13)), h * 1.1, pal.bright, 0.34 * k)
  glow(ctx, w * (0.32 + 0.04 * Math.cos(t * 0.11)), h * 1.05, h * 0.8, pal.bright, 0.14 * k)

  for (let i = 0; i < 3; i++) {
    const sway = Math.sin(t * 0.22 + i * 1.9)
    const sway2 = Math.cos(t * 0.17 + i * 1.3)
    const px = pointer.x * (8 + i * 7) // deeper layers move more: parallax
    const xt = w * (0.56 + 0.13 * i) + sway * w * 0.018 + px
    const xb = xt - w * (0.1 + 0.05 * i) + sway2 * w * 0.02 + px

    ctx.beginPath()
    ctx.moveTo(xt, 0)
    ctx.bezierCurveTo(xt - w * 0.06 + sway2 * w * 0.03, h * 0.34, xb + w * 0.07 - sway * w * 0.03, h * 0.68, xb, h)
    ctx.lineTo(w + 40, h)
    ctx.lineTo(w + 40, 0)
    ctx.closePath()

    const g = ctx.createLinearGradient(xt, 0, w, h)
    g.addColorStop(0, rgba(pal.deep, (0.5 + 0.17 * i) * k))
    g.addColorStop(1, rgba(pal.bright, (0.3 + 0.1 * i) * k))
    ctx.fillStyle = g
    ctx.fill()

    ctx.lineWidth = 1.5
    ctx.strokeStyle = rgba(pal.soft, 0.22 * k)
    ctx.stroke()
  }

  for (const b of bokeh) {
    const y = (((b.y - t * b.speed) % 1) + 1) % 1
    const x = b.x + Math.sin(t * 0.3 + b.phase) * 0.012
    const px = x * w + pointer.x * (4 + b.r * 0.6)
    const py = y * h + pointer.y * (4 + b.r * 0.6)
    const a = (0.1 + 0.08 * Math.sin(t * 0.8 + b.phase)) * k
    glow(ctx, px, py, b.r * 2.2, pal.soft, Math.max(0, a))
  }
}

/**
 * Animated hero background (canvas). Decoration only: aria-hidden, no pointer events.
 * Colours come from the theme tokens (--band, --primary, --accent) and follow light/dark.
 * It pauses when off screen or when the tab is hidden, and with
 * "reduce motion" it paints a single still frame.
 */
export function HeroBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const parent = canvas.parentElement as HTMLElement
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches

    let w = 0
    let h = 0
    let pal = readPalette()
    let bokeh: Bokeh[] = []
    let raf = 0
    let running = false
    let visible = true
    let last = performance.now()
    let clock = 0
    const pointer = { x: 0, y: 0 }
    const target = { x: 0, y: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = parent.clientWidth
      h = parent.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      bokeh = makeBokeh(w)
      frame(performance.now(), true)
    }

    function frame(now: number, once = false) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!once) clock += dt
      pointer.x += (target.x - pointer.x) * 0.06
      pointer.y += (target.y - pointer.y) * 0.06
      draw(ctx!, w, h, clock, pal, bokeh, pointer)
      if (!once && running) raf = requestAnimationFrame((n) => frame(n))
    }

    const start = () => {
      if (still || running || !visible || document.hidden) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame((n) => frame(n))
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onMove = (e: PointerEvent) => {
      const r = parent.getBoundingClientRect()
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(parent)
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    intersection.observe(parent)
    // Theme (dark class) switched: re-read the colours.
    const themeObserver = new MutationObserver(() => {
      pal = readPalette()
      frame(performance.now(), true)
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true })
      parent.addEventListener("pointerleave", onLeave)
      document.addEventListener("visibilitychange", onVisibility)
    }
    resize()
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      intersection.disconnect()
      themeObserver.disconnect()
      window.removeEventListener("pointermove", onMove)
      parent.removeEventListener("pointerleave", onLeave)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}
