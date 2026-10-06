/** Sub-groups of the DJ category, first match wins (the order decides: "Cabo USB para controladora" is a cable). */
export const DJ_TYPES = [
  { value: "cases", label: "Cases e bags", re: /\bcases?\b|\bbag\b|maleta|estojo/ },
  { value: "fones", label: "Fones", re: /\bfones?\b|headphone|headset/ },
  { value: "cabos", label: "Cabos e conectores", re: /\bcabos?\b|\bxlr\b|\bp10\b|\bplug\b|conector/ },
  { value: "microfones", label: "Microfones", re: /microfone/ },
  { value: "toca-discos", label: "Toca-discos", re: /toca.?discos|turntable/ },
  { value: "controladoras", label: "Controladoras, CDJs e mixers", re: /controlad|\bcdj|\bxdj|\bddj|\bdjm|mixer (para |de )?dj|leitor cd|multileitor|sampler|numark|rekordbox|serato/ },
  { value: "caixas", label: "Caixas e pedestais", re: /caixa|pedestal|tripe|subwoofer/ },
  { value: "mesas", label: "Mesas, interfaces e monitores", re: /mesa|interface|mixer|monitor/ },
  { value: "iluminacao", label: "Iluminação e efeitos", re: /moving|canhao|laser|globo|strobo?\b|fumaca|\bled\b|refletor|beam|scanner/ },
] as const

export function djTypeOf(title: string): string | null {
  const text = title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  return DJ_TYPES.find((t) => t.re.test(text))?.value ?? null
}
