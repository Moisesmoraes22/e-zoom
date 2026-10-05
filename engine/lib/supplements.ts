/** Terms that mark a product as a dietary supplement (the site's "suplementos" niche). */
const SUPPLEMENT =
  /\b(whey|creatina|bcaa|eaa|glutamina|pr[eé][- ]?treino|hipercal[oó]rico|albumina|case[ií]na|col[aá]geno|multivitam[ií]nico|[oô]mega[- ]?3|termog[eê]nico|suplemento|beta[- ]?alanina|citrulina|arginina|maltodextrina|dextrose|[cç]afe[ií]na|melatonina|magn[eé]sio|zma|tribulus|vitamina [a-dke]|pasta de amendoim|barra de prote[ií]na|coqueteleira|shaker|prote[ií]na)\b/i

/** Cosmetics, pet food and the like that reuse the same words. */
const NOT_SUPPLEMENT =
  /\b(shampoo|condicionador|cabelo|capilar|s[eé]rum|creme|hidratante|m[aá]scara|facial|sabonete|ra[cç][aã]o|c[aã]es|gatos|pets?|cachorro|l[aá]pis|brinquedo|garrafa|copo|mixer|misturador)\b/i

export const isSupplement = (title: string) => SUPPLEMENT.test(title) && !NOT_SUPPLEMENT.test(title)

if (process.argv[1]?.endsWith("supplements.ts")) {
  const yes = ["Whey Protein Isolado 900g", "Creatina Monohidratada 300g", "Pré-treino Insane 300g", "Coqueteleira Shaker 600ml"]
  const no = ["Shampoo Proteína Capilar", "Ração Premium Cães", "Fone Bluetooth", "Garrafa Térmica Shaker"]
  for (const t of yes) console.assert(isSupplement(t), t)
  for (const t of no) console.assert(!isSupplement(t), t)
  console.log("supplements ok")
}
