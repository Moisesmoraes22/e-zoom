
/** Sub-groups of the supplements category, first match wins. Same words the engine uses to detect supplements. */
export const SUPPLEMENT_TYPES = [
  { value: "whey", label: "Whey e proteínas", re: /whey|prote[ií]na|albumina|case[ií]na|barra de prote/ },
  { value: "creatina", label: "Creatina", re: /creatina/ },
  { value: "pre-treino", label: "Pré-treino e energia", re: /pre.?treino|cafeina|termogenico|citrulina|beta.?alanina/ },
  { value: "aminoacidos", label: "Aminoácidos", re: /bcaa|\beaa\b|glutamina|arginina/ },
  { value: "vitaminas", label: "Vitaminas e minerais", re: /vitamina|multivitam|omega|colageno|magnesio|zma|melatonina/ },
  { value: "massa", label: "Ganho de massa", re: /hipercalorico|maltodextrina|dextrose|pasta de amendoim|tribulus/ },
] as const

export type SupplementType = (typeof SUPPLEMENT_TYPES)[number]["value"]

export function supplementTypeOf(title: string): SupplementType | null {
  const text = title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
  return SUPPLEMENT_TYPES.find((t) => t.re.test(text))?.value ?? null
}
