/**
 * Terms that mark a product as DJ gear (the site's "dj" niche): controllers, mixers, CDJs,
 * turntables, DJ headphones, professional audio cables, interfaces, PA speakers, vocal
 * microphones, stands and cases, party lighting. Matched on the title without accents.
 *
 * Reviewed against the real Shopee feed: the bare word "DJ" is NOT enough (it is also a
 * furniture brand, a toy and a bike part), and car audio, phone microphones, generic AUX
 * cables, motorcycles and electrical parts are filtered out.
 */
const DJ = new RegExp(
  [
    "(controladora|controlador) (dj|midi)",
    "\\b(ddj|xdj|cdj|djm)[- ]?\\d+\\w*",
    "toca[- ]?discos",
    "turntable",
    "mixer (para |de )?dj",
    "\\bumc\\d+",
    "mixer (dj|de audio|de som|de \\d+ canais|\\d+ canais|analogico|digital|pioneer|behringer|numark)",
    "mesa (de )?(som|mixagem|audio|mixer)",
    "(fone|fones|headphone|headset)( de ouvido)? (dj|monitor|profissional|estudio)",
    "monitor (de )?(estudio|referencia)",
    "(pioneer dj|denon dj|numark|reloop|djcontrol|traktor|serato|rekordbox|native instruments)",
    "dj (controller|mixer|set|player|booth|stand|light|lights|led|pro|profissional)",
    "(kit|set|equipamento|iluminacao|luz|luzes|player|cabine|booth|stand|suporte|case|bag|capa) (de |para )?dj",
    "interface (mixer )?(de )?audio",
    "cabo (xlr|p10|trs|balanceado|desbalanceado|speakon|speak-on|para microfone|microfone)",
    "(conector|plug|plugue|adaptador) (xlr|speakon)",
    "xlr (macho|femea|p10|p2|rca|balanceado)",
    "cabo rca(?=.*(profissional|dj|mixer|hifi|hi-fi|estudio|neutrik|ophera))",
    "caixa (de som )?(ativa|passiva|pa)\\b",
    "subwoofer ativo",
    "microfone (dinamico|profissional|condensador|de mao|sem fio)",
    "(pedestal|tripe|suporte pedestal) (para |de )?(caixa|som|microfone)",
    "pedestal para microfone",
    "moving head",
    "maquina de fumaca",
    "\\bstrobe\\b",
    "canhao de luz led",
    "par led (rgb|dmx|\\d)",
    "laser (dj|show|festa)",
    "globo (de )?luz",
  ].join("|"),
  "i",
)

/** Costumes, toys, furniture, car audio, phone/creator gear, motorcycles and electrical parts. */
const NOT_DJ = new RegExp(
  [
    "fantasia", "boneco", "brinquedo", "camiseta", "\\bbone\\b", "pelucia", "infantil", "adesivo", "painel",
    "quebra[- ]?cabeca", "\\bjogos?\\b", "\\bps[345]\\b", "xbox", "gamer", "\\bgame\\b",
    "\\bpneu\\b", "\\bmoto\\b", "motocicleta", "\\bhonda\\b", "\\byamaha\\b", "\\bgarfo\\b", "\\baro \\d", "toyota", "yaris",
    "automotiv", "\\bcarro\\b", "veicular", "modulo amplificador", "disjuntor", "lampada", "\\bpingo\\b",
    "\\btv\\b", "\\brack\\b", "aparador", "buffet", "moveis", "mesa de (jantar|sala|centro|cabeceira)",
    "contrabaixo", "comunicador", "walkie",
    // spare parts, decor turntables and unrelated gear seen in the Mercado Livre results
    "agulha", "potenciometro", "\\bfader\\b", "\\bfonte\\b", "tact switch", "ferragens", "moldura", "pelicula",
    "cabo de forca", "correia universal","protractor", "headshell", "lanterna", "volante", "cruze", "porta cartas", "\\bcopo\\b",
    "\\bretro\\b", "vitrola", "\\bclassic\\b", "le son", "may record", "sintetizador", "amplificador (de )?baixo",
    "lapela", "ring light", "youtuber", "selfie", "celular", "iphone", "android", "smartphone", "usb-c", "tipo c", "micro usb", "3[.,]5 ?mm",
  ].join("|"),
  "i",
)

const plain = (title: string) => title.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

export const isDj = (title: string) => {
  const t = plain(title)
  return DJ.test(t) && !NOT_DJ.test(t)
}
