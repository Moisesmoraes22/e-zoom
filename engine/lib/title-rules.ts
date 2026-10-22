import type { OfferRow } from "../types.ts"

/**
 * Offers the Mercado Livre affiliate terms do not allow (used or refurbished items, controlled items,
 * services) and what the owner asked to keep out (lubricants, sweets and snacks). The title decides,
 * so the offer is never saved again, whichever search found it.
 *
 * Not here on purpose, until the owner decides: veterinary medicines and melatonin (see varredura-catalogo).
 * To add a rule, add one entry to RULES and a case to engine/tests/title-rules.test.ts.
 */
interface Rule {
  reason: string
  match: RegExp
  /** Categories where the words are normal (pet treats, supplement flavours, books about chocolate...). */
  skipCategories?: string[]
  /** Titles that contain the words but are harmless (fishing "agua doce", shaving "fita lubrificante"...). */
  harmless?: RegExp
}

const words = (pattern: string) => new RegExp(`(?<![a-z0-9])(?:${pattern})(?![a-z0-9])`)

const RULES: Rule[] = [
  {
    reason: "usado ou recondicionado",
    match: words("recondicionad\\w*|semi-?novos?|seminov\\w+|usad[oa]s?|de segunda mao|open box|refurbished|reembalad\\w+|mostruario(?! de unhas)\\w*"),
    harmless: words("outlet de fabrica|volta as aulas"),
  },
  {
    reason: "lubrificante ou produto adulto",
    match: words("gel lubrificante\\w*|lubrificante intimo|preservativos?|camisinhas?|sex ?shop|anel (?:de )?erec\\w*|erecao|excitante|vibrador\\w*|consolo|retardante|estimulante sexual"),
    harmless: words("barbe\\w+|lamina\\w*"),
  },
  {
    reason: "doce, salgado ou alimento",
    match: words("bombons?|doces?|salgad\\w+|biscoitos?|bolachas?|snacks?|sorvetes?|brigadeiros?|pacocas?|trufas?|panetones?|chocolates?|pirulitos?|chicletes?|jujuba\\w*|pipoca|sequilhos?|torradas?|wafer|cookies?|barra de cereal"),
    skipCategories: ["animais", "suplementos", "brinquedos", "beleza", "dermocosmeticos", "livros", "perfumes", "higiene-cuidados"],
    harmless: words(
      "sabor|whey|creatina|proteina|para (?:caes|gatos|cachorros?)|pet|perfume|esmalte|colonia|boneca|brinquedo|pesca|agua (?:doce|salgada)|pipoqueira|carretilha|colher|maquina|molinete|isca|anzol|forma|cortador|massa de|fechar massas|mini ?joy|popcorn maker|erva-? ?doce|flauta|sabonete|desodorante|carqueja|rosa-?chiclete|cor chocolate|mordedor|bolacha do liquidificador|cha |capa|cinta|meia",
    ),
  },
  {
    reason: "narguile, tabaco ou bebida alcoolica",
    match: words("narguile\\w*|hookah|essencia para narguile|vape|pod descartavel|cigarros? eletronico|gin tanqueray|whisky|vodka|cachaca|cerveja artesanal|vinhos? (?:tinto|branco|rose)"),
    harmless: words("violao|guitarra|sofa|poltrona"),
  },
  {
    reason: "arma de pressao ou airsoft",
    match: words("pistola (?:de )?airsoft|bbs? (?:rossi|airsoft)|bolinhas? (?:de )?airsoft|arma de airsoft|carabina|espingarda|chumbinho|taser|spray de pimenta|soco ingles"),
  },
  {
    reason: "curso ou servico",
    match: words("curso (?:basico|completo|online|de)|aulas? online|mentoria|consultoria|cartao presente|gift card|assinatura anual|recarga de celular"),
    skipCategories: ["livros"],
    harmless: words("metodo de leitura"),
  },
]

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/** Why this offer must not be listed, or null when it is fine. */
export function prohibitedReason(offer: Pick<OfferRow, "title" | "category_slug">): string | null {
  const title = fold(offer.title)
  for (const rule of RULES) {
    if (offer.category_slug && rule.skipCategories?.includes(offer.category_slug)) continue
    if (rule.match.test(title) && !rule.harmless?.test(title)) return rule.reason
  }
  return null
}

/** Splits the offers into the ones that stay and the ones left out (with the reason, for the run log). */
export function withoutProhibited<T extends Pick<OfferRow, "title" | "category_slug">>(offers: T[]) {
  const kept: T[] = []
  const dropped: { title: string; reason: string }[] = []
  for (const offer of offers) {
    const reason = prohibitedReason(offer)
    if (reason) dropped.push({ title: offer.title, reason })
    else kept.push(offer)
  }
  return { kept, dropped }
}

/** "3 usado ou recondicionado, 1 curso ou servico" for the run log. */
export function summarizeDropped(dropped: { reason: string }[]) {
  const counts = new Map<string, number>()
  for (const d of dropped) counts.set(d.reason, (counts.get(d.reason) ?? 0) + 1)
  return [...counts].map(([reason, n]) => `${n} ${reason}`).join(", ")
}
