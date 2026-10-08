/**
 * Fixes the category that a store's own tree gives an offer when the TITLE clearly says
 * otherwise (sneakers filed under sports, hair dryers under home, SSDs under games...).
 * Applied by every collector, so a later run does not undo a correction.
 *
 * Words are matched whole (accents included); `from` limits a rule to the categories
 * where the mistake is known to happen, so a correct category is never second-guessed.
 */
const word = (alts: string) => new RegExp(`(?<![\\p{L}\\d])(?:${alts})(?![\\p{L}\\d])`, "iu")
const at = (alts: string) => new RegExp(`^(?:${alts})(?![\\p{L}\\d])`, "iu")

const SHOE = word("t[eê]nis|chinelo|chuteira|sapatilha|sand[aá]lia|sapato|botas?|coturno|tamanco|mocassim")
const NOT_SHOE = /(bola|raquete|mesa|beach|padel|pickleball|overgrip|bolinha|ping|capa de chuva|\bmeias?\b|prote[cç][aã]o|tapete|arm[aá]rio|sapateira|cabide|suporte|expositor)/i

const RULES: { from: string[]; test: (t: string) => boolean; to: string }[] = [
  // Shoes, caps, swimwear and bags all live in "moda" (Mercado Livre's "Calçados, Roupas e Bolsas").
  { from: ["esporte"], to: "moda", test: (t) => (SHOE.test(t) && !NOT_SHOE.test(t)) || /^(vans|olympikus|nike (court|air|revolution)|fila (rise|racer|striker)|mizuno wave)/i.test(t) },
  { from: ["esporte", "bebes", "brinquedos"], to: "moda", test: (t) => at("bon[eé]|chap[eé]u").test(t) },
  { from: ["esporte"], to: "moda", test: (t) => word("sungas?|biqu[ií]ni").test(t) && !/infantil/i.test(t) },
  { from: ["eletronicos", "informatica"], to: "moda", test: (t) => /^mochila/i.test(t) },
  { from: ["beleza"], to: "moda", test: (t) => /cinta modeladora/i.test(t) },
  { from: ["games"], to: "informatica", test: (t) => word("ssd").test(t) && !/(jogos|gamer|gaming)/i.test(t) || /interno adata/i.test(t) },
  { from: ["games"], to: "eletronicos", test: (t) => word("microfone").test(t) && !/(jogos|gamer|gaming)/i.test(t) || /fone de ouvido com fio/i.test(t) },
  { from: ["casa", "eletrodomesticos"], to: "eletronicos", test: (t) => /^tv /i.test(t) || /c[aâ]mera (inteligente|de seguran[cç]a)/i.test(t) },
  { from: ["eletronicos", "informatica"], to: "casa", test: (t) => /^(escrivaninha|mesa multiuso|mesa para escrit|mesa em l|mesa diretor|escada dom|painel de natal|astronauta|marcador retroprojetor|caixa papel sulfite)/i.test(t) },
  { from: ["moda"], to: "casa", test: (t) => /balan[cç]a hardline/i.test(t) },
  { from: ["bebes", "brinquedos"], to: "casa", test: (t) => /(kit silicone para panelas|edredom casal queen coberdrom)/i.test(t) },
  { from: ["beleza"], to: "casa", test: (t) => /kit organizadores com 14/i.test(t) },
  { from: ["casa", "eletrodomesticos"], to: "beleza", test: (t) => /(escova secadora|^prancha (philco|de cabelo|lizze|gama)|modelador de cachos|secador de cabelo)/i.test(t) },
  { from: ["bebes", "brinquedos"], to: "beleza", test: (t) => /escova de dente el[eé]trica/i.test(t) },
  { from: ["beleza", "moda"], to: "bebes", test: (t) => /(mamadeira|huggies|babador)/i.test(t) && !/bigfral/i.test(t) },
  { from: ["esporte"], to: "brinquedos", test: (t) => /mrbeast/i.test(t) },
  { from: ["bebes", "brinquedos", "moda"], to: "esporte", test: (t) => /(taco de sinuca|lanterna (t[aá]tica|de cabe[cç]a))/i.test(t) },
  { from: ["eletronicos", "informatica"], to: "games", test: (t) => /(roblox|razer gold|itunes)/i.test(t) },
  { from: ["esporte"], to: "suplementos", test: (t) => /(anabolic mass|metilcobalamina|vitamina b12)/i.test(t) },
]

export function refineCategory(title: string, category: string | null | undefined): string | null {
  if (!category) return null
  return RULES.find((r) => r.from.includes(category) && r.test(title))?.to ?? category
}
