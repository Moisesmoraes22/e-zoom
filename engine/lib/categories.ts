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

// Power and hand tools, named for what they are (never a word like "serra" or "broca" alone).
const TOOL = word(
  "furadeira|parafusadeira|esmerilhadeira|lixadeira|politriz|tupia|plaina|ma[çc]arico|multiferramenta|motosserra|torno de bancada|morsa|brocas?|soquetes? (sextavados?|estriados?|de impacto)|grampeador pneum[aá]tico|pinador|finca pino|discos? (de corte|diamantados?)|grampo (sargento|de marceneiro)|serra (circular|tico[- ]tico|m[aá]rmore|sabre|copo|fita|manual|de arco|dobr[aá]vel)|alicates?|jogo (de )?chaves?|macaco hidr[aá]ulico|chaves? (de fenda|philips|inglesa|allen|torx|catraca|combinadas?|de combina[cç][aã]o|estrela|biela|de impacto|de roda|de teste|multifuncional|teste)|martelo|marreta|trena|n[ií]vel (a laser|de bolha)|mult[ií]metro|detectora? de tens[aã]o|term[oô]metro infravermelho|(maleta|jogo|kit|caixa|conjunto) (de |para )?ferramentas?|(jogo|kit|conjunto) de (chaves|soquetes|brocas|machos?|limas?)|jogo de macho|lima (agulha|chata|redonda)|pistola (de fixa[çc][aã]o|de pregos)|soprador t[eé]rmico|compressor de ar|torqu[ií]metro",
)
// Look-alikes: toys, books, plush, nail and manicure kits, cleaning and painting gear, magnets, fans.
const NOT_TOOL = /(brinquedo|infantil|alicate (de |para |cortador de |mola dupla de cortar )?unhas?|cortador de unhas?|unhas|alongamento|desencravador|cut[ií]cula|manicure|cutelaria|pet|boneco|pel[uú]cia|bicho|partida|pneu|ve[ií]culo|livro|capit[aã]o|ventilador|snow foam|pulverizador|borrifador|pistola de pintura|lavadora|im[aã]s? (de )?neod[ií]mio|arame|assoprador|soprador (de ar|turbo)|tigela|trenó|higr[oô]metro|cabo (usb|6a)|termostato|timer|temporizador|controlador|carregador|teclado|ovos)/i

/** True when the title names a tool: used to keep a catalog search for tools free of look-alikes. */
// A power tool is a power tool even when its title also says "carregador" or "controlador".
const STRONG = word("furadeira|parafusadeira|esmerilhadeira|lixadeira|politriz|tupia|plaina|motosserra|mult[ií]metro|ma[çc]arico")
export const isTool = (title: string) =>
  (TOOL.test(title) || /\dserra (circular|m[aá]rmore)/i.test(title)) && (!NOT_TOOL.test(title) || STRONG.test(title))

// The noun that OPENS a title says what the product is ("Tênis Infantil", "Caminha para Cachorro");
// words further on only qualify it. Pet products are the exception: "para cães" anywhere settles it.
const lead = (alts: string) => new RegExp(`^(?:(?:kit|conjunto|combo)\\s+)?(?:\\d+\\s*(?:pe[cç]as?|pcs?|pares?|un)?\\.?\\s+)?(?:${alts})(?![\\p{L}\\d])`, "iu")
const LEAD_SHOE = lead("t[eê]nis(?! de mesa)|sand[aá]lias?|sapatilhas?|chinelos?|botinhas?|botas?|sapatos?")
const PET = /(^(caminha|casinha|coleira|arranhador|comedouro|ra[cç][aã]o)\b|\bcama pet\b|\b(para|p\/|pra|de) (c[aã]es|c[aã]o|cachorros?|gatos?|pets?)\b)/i

const RULES: { from: string[]; test: (t: string) => boolean; to: string }[] = [
  { from: ["brinquedos", "bebes", "esporte"], to: "moda", test: (t) => LEAD_SHOE.test(t) },
  { from: ["games"], to: "moda", test: (t) => lead("camisetas?|camisa").test(t) },
  { from: ["esporte", "festas", "casa", "brinquedos", "acessorios-veiculos"], to: "animais", test: (t) => PET.test(t) },
  { from: ["esporte"], to: "bebes", test: (t) => /^colch[aã]o para carrinho/i.test(t) },
  { from: ["bebes"], to: "brinquedos", test: (t) => /reborn/i.test(t) },
  { from: ["cameras", "festas"], to: "eletronicos", test: (t) => /^cabo /i.test(t) },
  { from: ["festas"], to: "esporte", test: (t) => /^garrafa squeeze/i.test(t) },
  // The store's own "tools" tree also holds look-alikes: send them where they belong.
  { from: ["ferramentas"], to: "eletrodomesticos", test: (t) => /^(chuveiro|lavadora|mini ventilador)/i.test(t) },
  { from: ["ferramentas"], to: "industria", test: (t) => /(^|\s)[ií]m[aã]s?(\s|$)/i.test(t) },
  { from: ["ferramentas"], to: "casa", test: (t) => /^(pulverizador|borrifador)/i.test(t) },
  { from: ["ferramentas"], to: "construcao", test: (t) => /pistola de pintura/i.test(t) },
  { from: ["ferramentas"], to: "saude", test: (t) => /^tala /i.test(t) },
  { from: ["ferramentas"], to: "arte-papelaria", test: (t) => /bot[aã]o de press[aã]o/i.test(t) },
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
  { from: ["casa", "eletronicos", "eletrodomesticos", "informatica", "celulares", "moda", "esporte"], to: "ferramentas", test: isTool },
  { from: ["esporte"], to: "suplementos", test: (t) => /(anabolic mass|metilcobalamina|vitamina b12)/i.test(t) },
]

export function refineCategory(title: string, category: string | null | undefined): string | null {
  if (!category) return null
  return RULES.find((r) => r.from.includes(category) && r.test(title))?.to ?? category
}
