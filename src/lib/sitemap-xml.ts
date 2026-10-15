// Sitemap pieces kept free of imports so they can be checked with plain `node`.

/** Offers per product sitemap: small files are read faster and the strongest offers come first. */
export const SITEMAP_CHUNK = 5000

const esc = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

const HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n'

export interface SitemapEntry {
  url: string
  /** Date or ISO string; left out when unknown. */
  lastModified?: string | Date
}

const day = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

/** One <urlset>: the pages of a single sitemap file. */
export function urlsetXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified ? day(entry.lastModified) : null
      return `<url><loc>${esc(entry.url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`
    })
    .join("\n")
  return `${HEAD}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

/** The <sitemapindex> that lists every sitemap file. */
export function sitemapIndexXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastModified ? day(entry.lastModified) : null
      return `<sitemap><loc>${esc(entry.url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</sitemap>`
    })
    .join("\n")
  return `${HEAD}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

/** How many product sitemap files `total` offers need. */
export const productChunks = (total: number) => Math.ceil(total / SITEMAP_CHUNK)

/** The file name a requested sitemap must match: "paginas.xml" or "produtos-<n>.xml" (n from 1). */
export function parseSitemapName(name: string): { kind: "paginas" } | { kind: "produtos"; part: number } | null {
  if (name === "paginas.xml") return { kind: "paginas" }
  const match = /^produtos-([1-9]\d{0,3})\.xml$/.exec(name)
  return match ? { kind: "produtos", part: Number(match[1]) } : null
}
