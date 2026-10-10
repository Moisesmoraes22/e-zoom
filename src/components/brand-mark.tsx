/**
 * The E-Zoom monogram (an "E" and a "Z" with a wing). Drawn with currentColor, so it follows the
 * text colour: `text-primary` gives the brand blue in both themes.
 * Provisional vector, redrawn from the logo preview; swap the paths when the original SVG arrives.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-4 24 684 584" fill="currentColor" aria-hidden className={className}>
      <path d="M230 28H537L352 500H520L572 603H185L370 127H190Z" />
      <path d="M135 262H290L250 358H95Z" />
      <path d="M42 505H190L152 602H4Z" />
      <path d="M658 219C672 250 678 290 660 325C648 348 632 362 623 372L646 380C640 392 622 402 600 412C575 421 540 421 506 410C485 404 460 392 439 375C450 345 462 316 487 254C520 266 560 258 608 236C612 262 598 280 585 289C610 284 640 262 658 219Z" />
    </svg>
  )
}
