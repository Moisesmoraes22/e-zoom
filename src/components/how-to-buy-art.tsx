import type { ReactNode } from "react"

/*
 * The three drawings of "Veja como comprar", made in SVG: sharp at any size, a few KB, and they follow
 * the site's blue. A soft, slightly 3D style: gradients for volume, a light top edge, a soft shadow below.
 * Each drawing has its own gradient ids (a page holds several SVGs, ids are global to the document).
 */

const BLUE_LIGHT = "#7db1ff"
const BLUE = "#2b6af0"
const BLUE_DEEP = "#1448b8"
const NAVY = "#102a6b"

function Defs({ p }: { p: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-blue`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={BLUE_LIGHT} />
        <stop offset="1" stopColor={BLUE} />
      </linearGradient>
      <linearGradient id={`${p}-blue-deep`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={BLUE} />
        <stop offset="1" stopColor={BLUE_DEEP} />
      </linearGradient>
      <linearGradient id={`${p}-navy`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a4fb0" />
        <stop offset="1" stopColor={NAVY} />
      </linearGradient>
      <linearGradient id={`${p}-card`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#edf3ff" />
      </linearGradient>
      <linearGradient id={`${p}-gray`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#dbe3f1" />
        <stop offset="1" stopColor="#c9d4e6" />
      </linearGradient>
      <linearGradient id={`${p}-amber`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd96b" />
        <stop offset="1" stopColor="#f5a623" />
      </linearGradient>
      <linearGradient id={`${p}-green`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5fe08a" />
        <stop offset="1" stopColor="#12a150" />
      </linearGradient>
      <radialGradient id={`${p}-blob`} cx="0.5" cy="0.5" r="0.6">
        <stop offset="0" stopColor="#dbe8ff" />
        <stop offset="1" stopColor="#eef4ff" stopOpacity="0" />
      </radialGradient>
      <filter id={`${p}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#1d4fbf" floodOpacity="0.2" />
      </filter>
      <filter id={`${p}-soft`} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#102a6b" floodOpacity="0.28" />
      </filter>
    </defs>
  )
}

const STAR = "M0 -10 L3 -3.3 L10.2 -3 L4.6 1.6 L6.3 8.8 L0 5 L-6.3 8.8 L-4.6 1.6 L-10.2 -3 L-3 -3.3 Z"

/** Over-ear headphones, drawn inside a 200 x 200 box. */
function Phones({ p }: { p: string }) {
  return (
    <g>
      {/* headband */}
      <path d="M32 120 C32 14 168 14 168 120" fill="none" stroke={`url(#${p}-navy)`} strokeWidth="26" strokeLinecap="round" />
      <path d="M32 120 C32 14 168 14 168 120" fill="none" stroke={`url(#${p}-blue)`} strokeWidth="17" strokeLinecap="round" />
      <path d="M44 96 C52 38 148 38 156 96" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" />
      {/* left cup */}
      <rect x="8" y="78" width="58" height="104" rx="29" fill={`url(#${p}-blue-deep)`} />
      <ellipse cx="62" cy="130" rx="15" ry="46" fill={`url(#${p}-navy)`} />
      <rect x="14" y="86" width="22" height="70" rx="11" fill="#fff" fillOpacity="0.28" />
      <rect x="8" y="78" width="58" height="104" rx="29" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
      {/* right cup */}
      <rect x="134" y="78" width="58" height="104" rx="29" fill={`url(#${p}-blue-deep)`} />
      <ellipse cx="138" cy="130" rx="15" ry="46" fill={`url(#${p}-navy)`} />
      <rect x="164" y="86" width="22" height="70" rx="11" fill="#fff" fillOpacity="0.28" />
      <rect x="134" y="78" width="58" height="104" rx="29" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" />
    </g>
  )
}

/** A few short strokes around a drawing, like a spark. */
function Sparks({ items, p }: { items: { x: number; y: number; r: number; l?: number; c?: string }[]; p: string }) {
  return (
    <g strokeLinecap="round">
      {items.map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={s.x + (s.l ?? 22)}
          y2={s.y}
          transform={`rotate(${s.r} ${s.x} ${s.y})`}
          stroke={s.c ?? `url(#${p}-amber)`}
          strokeWidth="8"
        />
      ))}
    </g>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 560 320" className="h-full w-full" aria-hidden focusable="false">
      {children}
    </svg>
  )
}

/** Step 1: the offer card, with its discount, rating and the "Ver na loja" button being pressed. */
export function ChooseArt() {
  const p = "ht1"
  return (
    <Frame>
      <Defs p={p} />
      <ellipse cx="300" cy="170" rx="250" ry="130" fill={`url(#${p}-blob)`} />
      {/* card */}
      <rect x="62" y="52" width="440" height="216" rx="30" fill={`url(#${p}-card)`} filter={`url(#${p}-shadow)`} />
      <rect x="62.5" y="52.5" width="439" height="215" rx="29.5" fill="none" stroke="#fff" strokeOpacity="0.9" />
      {/* headphones */}
      <g transform="translate(64 42) scale(1.02)" filter={`url(#${p}-soft)`}>
        <Phones p={p} />
      </g>
      {/* text lines and rating */}
      <rect x="290" y="84" width="170" height="13" rx="6.5" fill={`url(#${p}-gray)`} />
      <rect x="290" y="110" width="120" height="13" rx="6.5" fill={`url(#${p}-gray)`} fillOpacity="0.8" />
      <g transform="translate(300 152)">
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            d={STAR}
            transform={`translate(${i * 25} 0) scale(1.15)`}
            fill={i < 4 ? `url(#${p}-amber)` : "#d5deed"}
          />
        ))}
      </g>
      {/* button */}
      <g filter={`url(#${p}-soft)`}>
        <rect x="282" y="190" width="186" height="52" rx="16" fill={`url(#${p}-blue-deep)`} />
      </g>
      <rect x="283" y="191" width="184" height="24" rx="15" fill="#fff" fillOpacity="0.16" />
      <text x="308" y="224" fontSize="21" fontWeight="800" fill="#fff" fontFamily="inherit">
        Ver na loja
      </text>
      <g transform="translate(433 206)" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M0 4 H-1 a3 3 0 0 0 -3 3 V19 a3 3 0 0 0 3 3 H11 a3 3 0 0 0 3 -3 V17" />
        <path d="M6 12 L18 0 M10 0 H18 V8" />
      </g>
      {/* discount badge */}
      <g transform="rotate(-5 80 62)" filter={`url(#${p}-soft)`}>
        <rect x="34" y="26" width="104" height="52" rx="16" fill={`url(#${p}-amber)`} />
        <text x="86" y="62" fontSize="30" fontWeight="800" fill="#1b2433" textAnchor="middle" fontFamily="inherit">
          -35%
        </text>
      </g>
      {/* pointer */}
      <g transform="translate(452 214) rotate(-10)" filter={`url(#${p}-soft)`}>
        <path d="M0 0 L0 40 L11 30 L19 48 L28 44 L20 27 L34 27 Z" fill="#fff" stroke="#0f1b3d" strokeWidth="4" strokeLinejoin="round" />
      </g>
      <Sparks p={p} items={[{ x: 488, y: 196, r: -50 }, { x: 497, y: 224, r: 8, l: 18 }]} />
      <Sparks p={p} items={[{ x: 22, y: 150, r: -35, l: 20, c: BLUE }, { x: 16, y: 190, r: -4, l: 26, c: BLUE }]} />
    </Frame>
  )
}

/** Step 2: the store page with price, shipping and delivery time to check. */
export function CheckArt() {
  const p = "ht2"
  const rows = [
    { y: 168, label: "Preço" },
    { y: 214, label: "Frete" },
    { y: 260, label: "Prazo de entrega" },
  ]
  return (
    <Frame>
      <Defs p={p} />
      <ellipse cx="290" cy="170" rx="250" ry="135" fill={`url(#${p}-blob)`} />
      {/* browser window */}
      <g filter={`url(#${p}-shadow)`}>
        <rect x="74" y="34" width="390" height="228" rx="24" fill={`url(#${p}-card)`} />
      </g>
      <path d="M74 58 a24 24 0 0 1 24 -24 H440 a24 24 0 0 1 24 24 V70 H74 Z" fill={`url(#${p}-blue-deep)`} />
      <circle cx="100" cy="52" r="6" fill="#fff" fillOpacity="0.9" />
      <circle cx="120" cy="52" r="6" fill="#fff" fillOpacity="0.9" />
      <circle cx="140" cy="52" r="6" fill="#fff" fillOpacity="0.9" />
      {/* product in the page */}
      <rect x="98" y="92" width="92" height="92" rx="18" fill="#e4edff" />
      <g transform="translate(112 106) scale(0.32)">
        <Phones p={p} />
      </g>
      <rect x="212" y="100" width="150" height="12" rx="6" fill={`url(#${p}-gray)`} />
      <rect x="212" y="124" width="104" height="12" rx="6" fill={`url(#${p}-gray)`} fillOpacity="0.8" />
      {/* checklist */}
      <g filter={`url(#${p}-soft)`}>
        <rect x="190" y="138" width="288" height="152" rx="22" fill="#fff" />
      </g>
      {rows.map((r, i) => (
        <g key={r.label}>
          <g transform={`translate(214 ${r.y - 12})`} fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            {i === 0 && (
              <>
                <path d="M2 2 H14 L24 12 L14 22 H2 Z" fill={BLUE} fillOpacity="0.14" />
                <circle cx="8" cy="12" r="2" fill={BLUE} />
              </>
            )}
            {i === 1 && (
              <>
                <path d="M0 4 H16 V18 H0 Z M16 9 H22 L26 14 V18 H16" fill={BLUE} fillOpacity="0.14" />
                <circle cx="6" cy="20" r="3" fill="#fff" />
                <circle cx="21" cy="20" r="3" fill="#fff" />
              </>
            )}
            {i === 2 && (
              <>
                <circle cx="12" cy="12" r="11" fill={BLUE} fillOpacity="0.14" />
                <path d="M12 6 V12 L17 15" />
              </>
            )}
          </g>
          <text x="254" y={r.y + 7} fontSize="20" fontWeight="700" fill="#0f1b3d" fontFamily="inherit">
            {r.label}
          </text>
          {i < 2 && <rect x={i === 0 ? 326 : 332} y={r.y - 6} width={i === 0 ? 70 : 64} height="10" rx="5" fill={`url(#${p}-gray)`} />}
          <circle cx="446" cy={r.y} r="14" fill={`url(#${p}-green)`} />
          <path d={`M439 ${r.y} l5 5 l9 -10`} fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* magnifier */}
      <g filter={`url(#${p}-soft)`}>
        <line x1="395" y1="112" x2="432" y2="148" stroke={`url(#${p}-navy)`} strokeWidth="16" strokeLinecap="round" />
        <circle cx="366" cy="84" r="42" fill="#fff" fillOpacity="0.4" stroke={`url(#${p}-blue-deep)`} strokeWidth="13" />
      </g>
      <path d="M338 70 a34 34 0 0 1 22 -20" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="5" strokeLinecap="round" />
      {/* parcel */}
      <g filter={`url(#${p}-soft)`}>
        <path d="M30 206 L82 190 L134 206 L82 224 Z" fill="#ffe29a" />
        <path d="M30 206 L82 224 V282 L30 262 Z" fill="#f3a93a" />
        <path d="M134 206 L82 224 V282 L134 262 Z" fill="#d9892a" />
        <path d="M60 197 L112 213 L112 226 L60 210 Z" fill="#fff" fillOpacity="0.55" />
        <path d="M82 224 V282" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
      </g>
      <Sparks p={p} items={[{ x: 22, y: 190, r: -30, l: 18 }, { x: 40, y: 168, r: -62, l: 18 }]} />
    </Frame>
  )
}

/** Step 3: the purchase completed on the store's own page. */
export function FinishArt() {
  const p = "ht3"
  return (
    <Frame>
      <Defs p={p} />
      <ellipse cx="320" cy="170" rx="240" ry="135" fill={`url(#${p}-blob)`} />
      {/* window */}
      <g filter={`url(#${p}-shadow)`}>
        <rect x="60" y="38" width="384" height="224" rx="26" fill={`url(#${p}-card)`} />
      </g>
      <path d="M60 64 a26 26 0 0 1 26 -26 H418 a26 26 0 0 1 26 26 V70 H60 Z" fill="#e6edf8" />
      <circle cx="88" cy="54" r="6" fill="#aebbd1" />
      <circle cx="108" cy="54" r="6" fill="#aebbd1" />
      <circle cx="128" cy="54" r="6" fill="#aebbd1" />
      {/* confirmation */}
      <g filter={`url(#${p}-soft)`}>
        <circle cx="252" cy="130" r="46" fill={`url(#${p}-green)`} />
      </g>
      <ellipse cx="252" cy="108" rx="34" ry="16" fill="#fff" fillOpacity="0.2" />
      <path d="M230 132 l16 16 l30 -34" fill="none" stroke="#fff" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="168" y="190" width="168" height="12" rx="6" fill={`url(#${p}-gray)`} />
      <rect x="198" y="212" width="108" height="11" rx="5.5" fill={`url(#${p}-gray)`} fillOpacity="0.8" />
      <rect x="92" y="236" width="320" height="16" rx="8" fill={`url(#${p}-blue-deep)`} />
      <rect x="196" y="241" width="112" height="6" rx="3" fill="#fff" fillOpacity="0.5" />
      {/* shopping bag */}
      <ellipse cx="452" cy="288" rx="62" ry="10" fill="#1d4fbf" fillOpacity="0.2" />
      <g filter={`url(#${p}-soft)`}>
        <path d="M410 140 H494 a8 8 0 0 1 8 7 L514 270 a14 14 0 0 1 -14 15 H404 a14 14 0 0 1 -14 -15 L402 147 a8 8 0 0 1 8 -7 Z" fill={`url(#${p}-blue-deep)`} />
      </g>
      <path d="M410 140 H494 a8 8 0 0 1 8 7 L504 168 H400 L402 147 a8 8 0 0 1 8 -7 Z" fill="#fff" fillOpacity="0.22" />
      <rect x="409" y="172" width="14" height="96" rx="7" fill="#fff" fillOpacity="0.18" />
      <path d="M424 142 C424 100 436 96 452 96 C468 96 480 100 480 142" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
      <path d="M424 142 C424 100 436 96 452 96 C468 96 480 100 480 142" fill="none" stroke="#c9d9ff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="424" cy="146" r="5" fill="#0f2a6b" />
      <circle cx="480" cy="146" r="5" fill="#0f2a6b" />
      <Sparks p={p} items={[{ x: 438, y: 70, r: -75, l: 24 }, { x: 488, y: 70, r: -35, l: 22 }, { x: 512, y: 112, r: 10, l: 20 }]} />
    </Frame>
  )
}
