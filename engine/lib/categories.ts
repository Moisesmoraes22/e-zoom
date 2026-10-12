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
  "furadeira|parafusadeira|esmerilhadeira|lixadeira|politriz|tupia|plaina|martelete|rompedor|serrote|form[aã]o|torqu[eê]s|estilson|ferro de solda|esta[cç][aã]o de solda|m[aá]quina de solda|inversora de solda|ma[çc]arico|multiferramenta|motosserra|torno de bancada|morsa|brocas?|soquetes? (sextavados?|estriados?|de impacto)|grampeador pneum[aá]tico|pinador|finca pino|discos? (de corte|diamantados?)|grampo (sargento|de marceneiro)|serra (circular|tico[- ]tico|m[aá]rmore|sabre|copo|fita|manual|de arco|dobr[aá]vel)|alicates?|jogo (de )?chaves?|macaco hidr[aá]ulico|chaves? (de fenda|philips|inglesa|allen|torx|catraca|combinadas?|de combina[cç][aã]o|estrela|biela|de impacto|de roda|de teste|multifuncional|teste)|martelo|marreta|trena|n[ií]vel (a laser|de bolha)|mult[ií]metro|detectora? de tens[aã]o|term[oô]metro infravermelho|(maleta|jogo|kit|caixa|conjunto) (de |para )?ferramentas?|(jogo|kit|conjunto) de (chaves|soquetes|brocas|machos?|limas?)|jogo de macho|lima (agulha|chata|redonda)|pistola (de fixa[çc][aã]o|de pregos)|soprador t[eé]rmico|compressor de ar|torqu[ií]metro",
)
// Look-alikes: toys, books, plush, nail and manicure kits, cleaning and painting gear, magnets, fans.
const NOT_TOOL = /(brinquedo|infantil|alicate (de |para |cortador de |mola dupla de cortar )?unhas?|cortador de unhas?|unhas|alongamento|desencravador|cut[ií]cula|manicure|cutelaria|pet\b|boneco|pel[uú]cia|bicho|partida|pneu\b|ve[ií]culo|livro|capit[aã]o|ventilador|snow foam|pulverizador|borrifador|pistola de pintura|lavadora|im[aã]s? (de )?neod[ií]mio|arame|assoprador|soprador (de ar|turbo)|tigela|trenó|higr[oô]metro|cabo (usb|6a)|termostato|timer|temporizador|controlador|carregador|teclado|ovos)/i

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

// Security cameras and CFTV kits: Mercado Livre files them under "Câmeras e Acessórios".
const CFTV = word("cftv|dvr|nvr|gravador de v[ií]deo|mhdx|balun|video ?porteiro|c[aâ]meras? (ip|wi-?fi|de seguran[cç]a|de monitoramento|de vigil[aâ]ncia|speed dome|bullet|dome|inteligente|externa)|kit (de )?(c[aâ]meras?|cftv)|central de alarme|alarme (residencial|monitorado)")

// Categories whose store tree is a grab bag (a drill filed under "agro", a fan under "antiguidades").
// For these the title decides, as long as it NAMES the product at its start.
const NOISY = ["agro", "antiguidades", "industria", "joias-relogios", "arte-papelaria", "festas"]

// A phone names itself first ("Smartphone Motorola...", "Celular iPhone 17...", "Galaxy A55..."); a word
// further on ("Capa para celular", "Tela Magnética ... Celular") only mentions it.
const PHONE_LEAD = lead("smartphone|celular|iphone|apple iphone|(?:samsung )?galaxy [a-z]?\\d+|redmi|xiaomi redmi|moto [gec]\\d+|motorola moto|poco [a-z]\\d+|realme")
const TOY_PHONE = /(infantil|brinquedo|mordedor|musical|simulador|de mentirinha)/i
const NOTEBOOK_LEAD = lead("notebook|(?:samsung )?galaxy book\\d*|macbook|chromebook|ideapad|vivobook|inspiron|aspire")
// Small appliances named at the start of the title.
const APPLIANCE_LEAD = lead("ventilador|liquidificador|cafeteira|chaleira|sanduicheira|air ?fryer|fritadeira|batedeira|aspirador|ferro de passar|purificador|umidificador|climatizador|micro-?ondas|geladeira|fog[aã]o|forno el[eé]trico")
// An IP / Wi-Fi security camera, not a car reversing camera or a photo camera.
const IP_CAMERA = /^c[aâ]mera\b.*\b(ip|wi-?fi|externa|seguran[cç]a|vigil[aâ]ncia|monitoramento|infravermelho|noturna)\b/i
const CAR_CAMERA = /(\br[eé]\b|estacionamento|automotiv|veicular|carro|\bmoto\b|dash ?cam|capacete)/i
const TOY_LEAD = lead("brinquedo|boneca|boneco|lego|quebra-cabe[cç]a|pel[uú]cia|carrinho de controle remoto")

// Made FOR a phone (case, film, charger, cable, holder...): the noun that opens the title says so.
// "Smartphone X com capa" starts with the phone and stays a phone (PHONE_LEAD, above).
// ...or anything sold "para celular / iPhone / Galaxy...": made for a phone, whatever it is.
const FOR_PHONE = /\bpara (celular|smartphone|iphone|galaxy|moto\b|xiaomi|redmi|samsung|motorola|poco|realme)/i
const PHONE_ACCESSORY_LEAD = lead(
  "capas?|capinhas?|cases?|pel[ií]culas?|protetor(?:es)? de (?:tela|lente|c[aâ]mera)|vidro temperado|carregador(?:es)?|cabos?|power ?banks?|fontes?|suportes?|pop ?sockets?|anel (?:de )?suporte|lentes?|adaptador(?:es)?|baterias?|telas?|displays?|m[oó]dulos?|gimbal|estabilizador|bast[aã]o de selfie|ring light|trip[eé]|protetor(?:es)? (?:de )?c[aâ]mera|frontal|gaveta|bandeja (?:de )?chip|microfones?|teleprompter|correia|cord[aã]o|pulseiras?"
)

// Perfumes: named by what they are or by a house that only makes fragrances (Arabian ones). Natura and
// Boticário also sell skincare, so those brands count only with a fragrance word or one of their lines.
const PERFUME = word(
  "perfumes?|col[oô]nias?|eau de (?:parfum|toilette|cologne)|parfum|body splash|[aá]gua de cheiro|fragr[aâ]ncias? (?:masculina|feminina|[aá]rabe)|lattafa|al haramain|armaf|afnan|rasasi|ajmal|arabian oud|maison alhambra|fragrance world|kaiak|malbec|egeo|floratta|quasar|zaad|212 vip|one million|invictus|sauvage|good girl|la vie est belle|bleu de chanel|acqua di gio",
)
// Room, car and fabric scents, miniatures-as-toys and bath products only borrow the word.
const NOT_PERFUME = /(seringa|adaptador|transferi|funil|pipeta|dispensador|atomizador|borrifador|flacone\b|recarreg[aá]vel|^(?:kit |\d+\/?[\d\/]* ?(?:pcs?|pe[cç]as?)? ?)?(?:\d+ )?frascos?\b|frascos? de perfume|\bfrascos? (?:de )?vidro (?:spray|para)|\bfrascos?\b.{0,20}\b(?:decant|[aâ]mbar)|\d+\s*frascos?\b|sem perfume|desinfetante|limpeza|detergente|amaciante|lava[- ]roupas|capilar|cabelo|penteadeira|espelho|c[oô]moda|ambient|aromatizador|difusor|odorizador|home spray|vela\b|incenso|carro|automotiv|para (roupas?|tecidos?|len[cç]ois)|sach[eê]|pet\b|c[aã]es|gatos?|sabonete|shampoo|condicionador|hidratante|creme|esfoliante|desodorante (?:antitranspirante|roll|spray aerossol)|brinquedo|boneca|fantasia|porta[- ]perfume|suporte|prateleira|organizador|expositor|embalagem|frasco vazio|vazio)/i

// Books: manga, Bibles, "livro" and comics at the START of the title. Merch about them (cases, shelves,
// posters, mugs, figures...) is not a book. Also taken from "brinquedos" etc., where stores file them.
const BOOK_LEAD = at("mang[aá]s?|b[ií]blias?|livros?|hqs?|(?:box|kit|combo|cole[cç][aã]o)\\b.{0,40}?\\b(?:livros?|mang[aá]s?|hqs?)|gibi|quadrinhos?|novo testamento|salmos|devocional")
// "Manga" is also a sleeve and a fruit: clothing words and sleeve lengths rule those out.
const NOT_BOOK = /(manga (curta|longa|comprida|larga|bufante|princesa|raglan|3\/4|cavada)|blusas?|camisas?|camisetas?|vestidos?|casacos?|jaquetas?|moletom|polpa|suco|fruta|\bkg\b|muda|sorvete|capa (para|de)|porta[- ]?livros?|estante|suporte|marcador|apoio|leitor|luminária|lumin[aá]ria|caneca|camiseta|poster|p[oô]ster|quadro|pel[uú]cia|boneco|action figure|funko|chaveiro|mochila|caderno|agenda|adesivo|mouse ?pad|tapete|jogo|quebra[- ]cabe[cç]a|mesa|prateleira|organizador|kit (?:de )?(?:leitura|escolar)|marca[- ]p[aá]ginas)/i

// Assembled desktop PCs: the title OPENS with the machine (PC Gamer..., Computador Completo..., CPU Gamer...,
// Mini PC...), so a case, a graphics card or a desk "para computador" never counts.
const PC_LEAD = lead("pc(?: gamer| completo| montado| desktop| home ?office| office| workstation)?|computador(?:es)?|cpu(?: gamer| completa)?|desktop(?: gamer| completo)?|mini ?pc|all[- ]?in[- ]?one|nuc|esta[cç][aã]o de trabalho")
const NOT_PC = /\b(gabinete|suporte|capa|limpeza|adaptador|cooler|water ?cooler|fonte|sem (?:cpu|gabinete|monitor|processador)|somente|apenas (?:o )?(?:gabinete|monitor)|case|ferramenta|jogo|brinquedo|simulador|mouse ?pad|pasta t[eé]rmica|ventoinha|fan)\b/i

// Dermocosmetics: pharmacy skincare houses and the actives that name the product. Make-up, devices
// (rollers, cleansing brushes) and pet items only borrow the words.
const DERMO = word(
  "la roche[- ]posay|vichy|cerave|bioderma|av[eè]ne|eucerin|isdin|uriage|ducray|svr|adcos|principia|cetaphil|effaclar|anthelios|toleriane|cicaplast|hyalu b5|mineral 89|liftactiv|sensibio|[aá]cido (?:hialur[oô]nico|salic[ií]lico|glic[oó]lico|azelaico|k[oó]jico)|niacinamida|retinol|s[eé]rum (?:facial|vitamina c|antioxidante|clareador|antissinais)|vitamina c (?:facial|s[eé]rum|pura)|(?:filtro|protetor) solar facial|[aá]gua micelar|gel de limpeza facial|sabonete facial|hidratante facial|creme (?:anti[- ]?idade|antissinais|facial|para o rosto)|contorno dos olhos|dermocosm[eé]ticos?",
)
const NOT_DERMO = /(maquiagem|batom|r[ií]mel|base l[ií]quida|p[oó] compacto|sombra|paleta|pincel|esponja|necessaire|aparelho|m[aá]quina|massageador|rolo|gua sha|jade|\bled\b|dermaroller|microagulhamento|caneta|vaporizador|esterilizador|toalha|faixa|touca|organizador|espelho|suporte|brinquedo|boneca|pet\b|c[aã]es|gatos?|cavalos?|veterin[aá]rio|dispenser|porta)/i

// Herbs and natural products: the noun that opens the title (tea, herb, essential oil, propolis...).
// Party "chá de bebê", cups, teapots, diffusers and plants only borrow the word.
const ERVAS_LEAD = lead(
  "ch[aá]s?|ervas?(?! mate)|camomila|boldo|hibisco|cavalinha|carqueja|esp[ií]nheira[- ]santa|unha de gato|c[uú]rcuma|moringa|espirulina|chlorella|valeriana|passiflora|ginkgo|ginseng|[oó]leos? essen(?:cial|ciais)|pr[oó]polis|fitoter[aá]pic[oa]s?|tintura(?: m[aã]e)?|extrato de (?:pr[oó]polis|ervas?)"
)
const NOT_ERVAS = /(ch[aá] (?:de )?(?:panela|beb[eê]|revela[cç][aã]o|cozinha|bar|lingerie)|x[ií]caras?|bules?|infusor|caneca|jogo de ch[aá]|kit (?:de )?ch[aá] (?:de )?(?:panela|beb[eê])|aparelho|bandeja|porta[- ]|garrafa|chaleira|coador|difusor|umidificador|aromatizador|vela\b|sabonete|shampoo|brinquedo|boneca|decora[cç][aã]o|artificial|vaso|jardim|semente|muda\b|adubo|fertilizante|tapete|cortina|ra[cç][aã]o|pet\b|c[aã]es|gatos?|roupa|camisa|camiseta|chimarr[aã]o|cuia|tereré|terere)/i

/** True when the title is a fragrance / a book: keeps a catalog search for them free of look-alikes. */
export const isPerfume = (title: string) => PERFUME.test(title) && !NOT_PERFUME.test(title)
export const isPcCompleto = (title: string) => PC_LEAD.test(title) && !NOT_PC.test(title)
export const isDermocosmetico = (title: string) => DERMO.test(title) && !NOT_DERMO.test(title)
export const isErvas = (title: string) => ERVAS_LEAD.test(title) && !NOT_ERVAS.test(title)
export const isBook = (title: string) => BOOK_LEAD.test(title) && !NOT_BOOK.test(title)

const RULES: { from: string[]; test: (t: string) => boolean; to: string }[] = [
  // Books come first: a title that opens with "Livro"/"Mangá"/"Bíblia" is one, whatever tree the store used.
  { from: ["beleza", "casa", "brinquedos", "moda", "esporte", "games", "bebes", "saude", "celulares", "eletronicos", "informatica", "arte-papelaria", "musica-filmes", "antiguidades", "festas", "ferramentas", "suplementos", "dj"], to: "livros", test: (t) => BOOK_LEAD.test(t) && !NOT_BOOK.test(t) },
  // Accessories that only talk about perfume (decant syringes, travel bottles) go back to "Beleza".
  { from: ["perfumes"], to: "beleza", test: (t) => PERFUME.test(t) && NOT_PERFUME.test(t) },
  // "Workstation" is also a synthesizer: it goes back to the instruments.
  { from: ["pc-completo"], to: "instrumentos", test: (t) => /sintetizador|teclado musical|synthesizer/i.test(t) },
  // A complete PC is its own category (the niche the site invests in), out of "Informática" and the grab bags.
  { from: ["informatica", "eletronicos", "games", "casa", "esporte", "celulares", ...NOISY], to: "pc-completo", test: isPcCompleto },
  // Fragrances leave "Beleza" and any grab bag they were dropped in.
  { from: ["beleza", "saude", "casa", "moda", "esporte", "suplementos", "joias-relogios", "antiguidades", "festas", "arte-papelaria", "celulares", "eletronicos", "alimentos-bebidas", "agro", "industria"], to: "perfumes", test: (t) => PERFUME.test(t) && !NOT_PERFUME.test(t) },
  // Dermocosmetics and herbs leave the grab bags of beauty and health (never the supplements niche).
  { from: ["beleza", "saude", "casa", "esporte", "moda", "brinquedos"], to: "dermocosmeticos", test: isDermocosmetico },
  { from: ["saude", "beleza", "casa", "esporte", "alimentos-bebidas", "agro", "festas", "arte-papelaria"], to: "ervas-naturais", test: isErvas },
  { from: ["brinquedos", "bebes", "esporte"], to: "moda", test: (t) => LEAD_SHOE.test(t) },
  { from: ["games"], to: "moda", test: (t) => lead("camisetas?|camisa").test(t) },
  { from: ["esporte", "festas", "casa", "brinquedos", "acessorios-veiculos"], to: "animais", test: (t) => PET.test(t) },
  { from: ["esporte"], to: "bebes", test: (t) => /^colch[aã]o para carrinho/i.test(t) },
  { from: ["bebes"], to: "brinquedos", test: (t) => /reborn/i.test(t) },
  // (A CFTV cable stays with the cameras: the CFTV rule below would send it straight back.)
  { from: ["cameras", "festas"], to: "eletronicos", test: (t) => /^cabo /i.test(t) && !CFTV.test(t) },
  { from: ["festas"], to: "esporte", test: (t) => /^garrafa squeeze/i.test(t) },
  // The store's own "tools" tree also holds look-alikes: send them where they belong.
  { from: ["ferramentas"], to: "eletrodomesticos", test: (t) => /^(chuveiro|lavadora|mini ventilador)/i.test(t) },
  { from: ["ferramentas"], to: "industria", test: (t) => /(^|\s)[ií]m[aã]s?(\s|$)/i.test(t) && !isTool(t) },
  { from: ["ferramentas"], to: "casa", test: (t) => /^(pulverizador|borrifador)/i.test(t) },
  { from: ["ferramentas"], to: "construcao", test: (t) => /pistola de pintura/i.test(t) },
  { from: ["ferramentas"], to: "saude", test: (t) => /^tala /i.test(t) },
  // Toy tool kits sit in the store's tools tree.
  { from: ["ferramentas"], to: "brinquedos", test: (t) => /\b(infantil|toy king|brinquedo)\b/i.test(t) },
  { from: ["ferramentas"], to: "arte-papelaria", test: (t) => /bot[aã]o de press[aã]o/i.test(t) },
  // Shoes, caps, swimwear and bags all live in "moda" (Mercado Livre's "Calçados, Roupas e Bolsas").
  { from: ["esporte"], to: "moda", test: (t) => (SHOE.test(t) && !NOT_SHOE.test(t)) || /^(vans|olympikus|nike (court|air|revolution)|fila (rise|racer|striker)|mizuno wave)/i.test(t) },
  { from: ["esporte", "bebes", "brinquedos"], to: "moda", test: (t) => at("bon[eé]|chap[eé]u").test(t) },
  { from: ["esporte"], to: "moda", test: (t) => word("sungas?|biqu[ií]ni").test(t) && !/infantil/i.test(t) },
  { from: ["eletronicos", "informatica"], to: "moda", test: (t) => /^mochila/i.test(t) },
  { from: ["beleza"], to: "moda", test: (t) => /cinta modeladora/i.test(t) },
  { from: ["games"], to: "informatica", test: (t) => word("ssd").test(t) && !/(jogos|gamer|gaming)/i.test(t) || /interno adata/i.test(t) },
  { from: ["games"], to: "eletronicos", test: (t) => word("microfone").test(t) && !/(jogos|gamer|gaming)/i.test(t) || /fone de ouvido com fio/i.test(t) },
  { from: ["casa", "eletronicos", "eletrodomesticos", "informatica", "celulares", "acessorios-veiculos", "industria", "construcao"], to: "cameras", test: (t) => CFTV.test(t) },
  { from: ["casa", "eletrodomesticos"], to: "eletronicos", test: (t) => /^tv /i.test(t) },
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
  // The title NAMES the product at its start: it overrides a store tree that is a grab bag.
  { from: ["eletronicos", "informatica", "games", "acessorios-veiculos", ...NOISY], to: "celulares", test: (t) => PHONE_LEAD.test(t) && !TOY_PHONE.test(t) },
  { from: ["eletronicos", "celulares"], to: "informatica", test: (t) => NOTEBOOK_LEAD.test(t) },
  { from: NOISY, to: "eletrodomesticos", test: (t) => APPLIANCE_LEAD.test(t) },
  { from: ["informatica", "eletronicos"], to: "cameras", test: (t) => IP_CAMERA.test(t) && !CAR_CAMERA.test(t) },
  { from: ["informatica", "eletronicos", ...NOISY], to: "brinquedos", test: (t) => TOY_LEAD.test(t) },
  { from: ["acessorios-veiculos"], to: "casa", test: (t) => /^tela mosquiteira/i.test(t) },
  // Phones live in "celulares"; what is sold for them has its own category (the phone's page suggests it).
  { from: ["celulares"], to: "acessorios-celular", test: (t) => (PHONE_ACCESSORY_LEAD.test(t) || FOR_PHONE.test(t)) && !PHONE_LEAD.test(t) },
  { from: ["casa", "eletronicos", "eletrodomesticos", "informatica", "celulares", "moda", "esporte"], to: "ferramentas", test: isTool },
  // In a grab-bag category too, except snap-button pliers (craft gear, sent to arte-papelaria from "ferramentas").
  { from: NOISY, to: "ferramentas", test: (t) => isTool(t) && !/bot[aã]o de press[aã]o/i.test(t) },
  { from: ["esporte"], to: "suplementos", test: (t) => /(anabolic mass|metilcobalamina|vitamina b12)/i.test(t) },
]

export function refineCategory(title: string, category: string | null | undefined): string | null {
  if (!category) return null
  return RULES.find((r) => r.from.includes(category) && r.test(title))?.to ?? category
}
