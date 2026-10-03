import { Api, TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions/index.js"

import {
  buildAffiliateUrl,
  canonicalize,
  resolveShortLink,
} from "../lib/links.ts"
import {
  extractTitle,
  extractUrls,
  guessCategory,
  parsePrices,
} from "../lib/message-parser.ts"
import type { Connector, OfferRow } from "../types.ts"

/** Reads og:image from the product page, the same tag link previews use. */
async function fetchPreviewImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; HibridLinkBot/1.0)" },
    })
    if (!response.ok) return null
    const html = (await response.text()).slice(0, 200_000)
    return (
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1] ??
      null
    )
  } catch {
    return null
  }
}

/**
 * Amazon's og:image is often the site logo, so use the product image by ASIN.
 * Products without a real photo return a tiny placeholder, which we reject.
 */
async function fetchAmazonImage(asin: string): Promise<string | null> {
  const url = `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_.jpg`
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const bytes = (await response.arrayBuffer()).byteLength
    return response.ok && bytes > 2000 ? url : null
  } catch {
    return null
  }
}

export function createTelegramConnector(env: NodeJS.ProcessEnv): Connector {
  const {
    TELEGRAM_API_ID,
    TELEGRAM_API_HASH,
    TELEGRAM_SESSION,
    TELEGRAM_CHANNELS,
    TELEGRAM_MESSAGES_PER_CHANNEL,
  } = env

  return {
    name: "telegram",
    async fetchOffers() {
      if (!TELEGRAM_API_ID || !TELEGRAM_API_HASH || !TELEGRAM_SESSION) {
        throw new Error(
          "Missing TELEGRAM_API_ID / TELEGRAM_API_HASH / TELEGRAM_SESSION (run `npm run engine:tg-login`)",
        )
      }
      const channels = (TELEGRAM_CHANNELS ?? "")
        .split(",")
        .map((c) => c.trim().replace(/^@/, ""))
        .filter(Boolean)
      if (channels.length === 0) {
        throw new Error("Set TELEGRAM_CHANNELS (comma-separated channel usernames)")
      }
      const limit = Number(TELEGRAM_MESSAGES_PER_CHANNEL) || 50

      const client = new TelegramClient(
        new StringSession(TELEGRAM_SESSION),
        Number(TELEGRAM_API_ID),
        TELEGRAM_API_HASH,
        { connectionRetries: 3 },
      )
      await client.connect()

      const offers = new Map<string, OfferRow>()
      try {
        for (const channel of channels) {
          console.log(`[telegram] lendo ${channel}...`)
          const messages = await client.getMessages(channel, { limit })
          console.log(`[telegram] ${channel}: ${messages.length} mensagens`)
          // Newest first: the first sighting of a product wins.
          for (const message of messages) {
            const text = message.message
            if (!text) continue

            const hiddenLinks = (message.entities ?? [])
              .filter((e): e is Api.MessageEntityTextUrl => e instanceof Api.MessageEntityTextUrl)
              .map((e) => e.url)
            let canonical = null
            for (const raw of [...extractUrls(text), ...hiddenLinks]) {
              // Channels use their own shorteners (e.g. aoferta.net): any link we can't
              // read directly gets its redirects followed.
              canonical = canonicalize(raw) ?? canonicalize(await resolveShortLink(raw))
              if (canonical) break
            }
            if (!canonical) continue

            const key = `${canonical.store_id}:${canonical.external_id}`
            if (offers.has(key)) continue

            const prices = parsePrices(text)
            const title = extractTitle(text)
            if (!prices || !title) continue

            console.log(`[telegram] + ${canonical.store_id} ${canonical.external_id} R$ ${prices.price}`)
            offers.set(key, {
              store_id: canonical.store_id,
              external_id: canonical.external_id,
              title,
              image:
                canonical.store_id === "amazon"
                  ? await fetchAmazonImage(canonical.external_id)
                  : await fetchPreviewImage(canonical.url),
              category_slug: guessCategory(title),
              price: prices.price,
              original_price: prices.original,
              url: canonical.url,
              affiliate_url: buildAffiliateUrl(canonical, env),
              is_free_shipping: /frete\s+gr[aá]tis/i.test(text),
              source: "telegram",
            })
          }
        }
      } finally {
        await client.disconnect()
      }
      return [...offers.values()]
    },
  }
}
