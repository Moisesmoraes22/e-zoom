import assert from "node:assert/strict"
import { test } from "node:test"

import { refineCategory } from "../lib/categories.ts"

// [title, category the store gave, category it must end up in]. Every mistake found in a
// review goes here, so it can never come back. Add a row whenever a new one is found.
const CASES: [string, string, string][] = [
  // shoes filed as sports/fashion
  ["Tênis Feminino Racer Speedzone Fila", "esporte", "moda"],
  ["Vans Old Skool Adulto Unissex", "esporte", "moda"],
  ["Chuteira Futsal Umbro Pro 5 Bump Club Masculina", "esporte", "moda"],
  ["Nike Court Vision Low Next Nature Masculino Adultos", "esporte", "moda"],
  ["Chinelo Feminino Slim Havaianas Liso", "moda", "moda"],
  ["Fila Rise Up Masculino", "moda", "moda"],
  // ...but not things that only mention the word
  ["Bola De Tênis Wilson Championship Extra Duty Tubo 3 Bolas", "esporte", "esporte"],
  ["Kit 2 Raquete Tenis De Mesa Ping Pong Lisa", "esporte", "esporte"],
  ["Capa De Chuva Transparente Completa Com Bota Calça Capa Capuz", "esporte", "esporte"],
  ["Kit 6 Pares Meias Lupo Original Sapatilha Algodão", "moda", "moda"],
  ["Tênis Infantil Menino Calce Fácil Casual", "moda", "moda"],
  // electronics filed as games / home
  ["SSD Kingston NV3 500GB M2 2280 NVME PCIe 4.0", "games", "informatica"],
  ["Microfone Hollyland Lark A1 Duo Usb-c cor Preto", "games", "eletronicos"],
  ["Câmera de Segurança Inteligente Intelbras iM3 C Branca", "casa", "cameras"],
  ["Kit Cftv 4 Câmeras Intelbras Full Hd com Dvr 1tb", "eletronicos", "cameras"],
  ["Gravador De Vídeo De Câmeras Mhdx 3116 16 Canais", "eletronicos", "cameras"],
  ["Câmera Ip Wifi Externa Prova D'água Visão Noturna", "casa", "cameras"],
  ["Martelete Rompedor Bosch Gbh 2-24 Dre", "casa", "ferramentas"],
  ["Estação de Solda Digital 60w Hikari", "eletronicos", "ferramentas"],
  ["Tv Smart 43 Polegadas Aoc Roku Hd Wi-fi", "casa", "eletronicos"],
  ["Fones de ouvido para jogos sem fio Redragon H510-PRO", "games", "games"],
  ["Rack Suspenso para TV até 55 Polegadas 160cm", "casa", "casa"],
  ["Mesa digitalizadora H420 com caneta", "eletronicos", "eletronicos"],
  // home / beauty / fashion / kids
  ["Escrivaninha De Escritório Home Office Berlim Em L", "eletronicos", "casa"],
  ["Painel de Natal Fundo Fotográfico Cenário Natalino", "eletronicos", "casa"],
  ["Prancha Philco PPR10 Titanium Digital Bivolt 230°C", "casa", "beleza"],
  ["Escova Secadora Britânia Bec07r 4 Em 1 1300w", "casa", "beleza"],
  ["Taiff Black Ion Secador De Cabelo Profissional 2000w", "casa", "beleza"],
  ["Refil Escova de Dente Elétrica Oral-B Precision Clean", "bebes", "beleza"],
  ["Boné MST Aba Curva Vermelho Ajustável", "esporte", "moda"],
  ["Boné Gucci Luxo Aba Curva Ajustável", "brinquedos", "moda"],
  ["Sunga Boxer Mash Masculina Estampada", "esporte", "moda"],
  ["Mochila Masculina Grande Notebook Impermeável", "eletronicos", "moda"],
  ["Cinta Modeladora Shortinho Confortável 4 Barbatanas", "beleza", "moda"],
  ["Buba Mamadeira Easy Flow Nuvem 270ml", "beleza", "bebes"],
  ["Lenços Umedecidos Huggies Recém Nascido Pack C/4", "beleza", "bebes"],
  ["Babador De Silicone Pega Migalhas Menina", "moda", "bebes"],
  ["Fralda Bigfral Derma Plus M 8 Unidades", "beleza", "beleza"],
  ["Taco De Sinuca Bilhar Profissional Com Capa Giz", "brinquedos", "esporte"],
  ["Lanterna Tática Led Le8311 Recarregável Usb", "moda", "esporte"],
  // tools filed as home / electronics
  ["Furadeira de Impacto Bosch GSB 550 Watts 127V", "casa", "ferramentas"],
  ["Jogo de Chaves de Fenda e Philips 6 Peças Magnéticas", "casa", "ferramentas"],
  ["Trena a Laser Digital 40m Medidor de Distância", "eletronicos", "ferramentas"],
  ["Maleta de Ferramentas 129 Peças com Parafusadeira", "eletrodomesticos", "ferramentas"],
  ["Multímetro Digital Profissional Hikari", "eletronicos", "ferramentas"],
  ["Alicate de Cutícula Inox Profissional", "esporte", "esporte"],
  ["Martelo de Brinquedo Infantil de Madeira", "casa", "casa"],
  ["Serra Circular Makita 7 1/4 1800W", "casa", "ferramentas"],
  ["Mesa de Serra Armário Cozinha 3 Portas", "casa", "casa"],
  // the opening noun decides, not a word further on
  ["Tênis Infantil Menino Calce Fácil Casual", "brinquedos", "moda"],
  ["Sandália Menino Infantil Volta as Aulas Preto", "brinquedos", "moda"],
  ["Kit Ping Pong Raquete Rede Retrátil Mesa Tênis Portátil", "brinquedos", "brinquedos"],
  ["Tênis de Mesa Raquete Profissional", "esporte", "esporte"],
  ["Camiseta Gamer Video Game Estampa", "games", "moda"],
  ["Caminha para Cachorros Cama Pet Colchonete Gatos", "esporte", "animais"],
  ["Casinha Cachorro N6 Porte Pequeno", "esporte", "animais"],
  ["Colchão para carrinho Moises Colchonete", "esporte", "bebes"],
  ["Bebê Reborn Boneca Silicone Menina", "bebes", "brinquedos"],
  ["Cabo Carregador Usb-c Tipo C Turbo 60w", "cameras", "eletronicos"],
  ["Garrafa Squeeze Plastico 750 Ml Academia", "festas", "esporte"],
  // look-alikes in the store's own tools tree
  ["Chuveiro elétrico de parede Lorenzetti 7.8kW", "ferramentas", "eletrodomesticos"],
  ["Lavadora De Alta Pressão Wap Ousada 1500w", "ferramentas", "eletrodomesticos"],
  ["Ímã Neodímio Ø 6x2 Mm N35 100 Unidades", "ferramentas", "industria"],
  ["Pulverizador Portátil Borrifador Manual 2 Litros", "ferramentas", "casa"],
  ["Pistola de Pintura Gravidade Hvlp 1,3mm", "ferramentas", "construcao"],
  ["Tala Para Dedo Em Martelo Indicador Médio", "ferramentas", "saude"],
  ["Kit Alicate Aplicador Botão de Pressão Roupas Bebê Artesanato", "ferramentas", "arte-papelaria"],
  ["Furadeira de Impacto Bosch GSB 550", "ferramentas", "ferramentas"],
  // a grab-bag store category: the title names the product
  ["Parafusadeira e Furadeira de Impacto 3/8\" WAP K21 ID02", "agro", "ferramentas"],
  ["Esmerilhadeira Angular 115mm BLACK+DECKER 12.000RPM G650", "agro", "ferramentas"],
  ["Chave De Fenda Tramontina Amarela Cartela Com 06 Pecas 4151", "joias-relogios", "ferramentas"],
  ["Ventilador de Coluna Britânia 6 Pás de 40cm 160W BVC41A", "antiguidades", "eletrodomesticos"],
  ["Chaleira Elétrica Inox 1,8 Litros Mondial", "antiguidades", "eletrodomesticos"],
  ["Liquidificador Daily Ri2110 2 Litros Philips Walita 550w", "industria", "eletrodomesticos"],
  ["Celular IPhone 17 Pro Max 256GB 5G Dual E-sim Lacrado", "eletronicos", "celulares"],
  ["Smartphone A07 256GB 8GB RAM 4G Câmera Traseira Dupla 50MP", "eletronicos", "celulares"],
  ["Samsung Galaxy Book4 Intel Core i5-1335U, Windows 11 Home", "eletronicos", "informatica"],
  ["Câmera A8 Externa Ip A Prova D'água - Infravermelho Alarme", "informatica", "cameras"],
  ["Brinquedo Mini Teclado Piano Rosa Infantil Musical", "informatica", "brinquedos"],
  ["Tela Mosquiteira Janela Grande Velcro Ajustável Anti Inseto", "acessorios-veiculos", "casa"],
  ["Kit Maleta Ferramentas Infantil 22 Peças Furadeira Elétrica Toy King", "ferramentas", "brinquedos"],
  ["Cabo Coaxial Bipolar 100m Ideal Cftv", "cameras", "cameras"],
  ["Cabo Coaxial Bipolar 100m Ideal Cftv", "eletronicos", "cameras"],
  ["Cabo HDMI 2.0 4k 3 Metros", "cameras", "eletronicos"],
  // ...and what only MENTIONS the product stays where it is
  ["Capa para Celular Samsung Galaxy A15 Silicone", "celulares", "celulares"],
  ["Celular Infantil Musical telefone Interativo com mordedor", "brinquedos", "brinquedos"],
  ["Câmera De Ré 420p Automotiva Estacionamento", "acessorios-veiculos", "acessorios-veiculos"],
  ["Película Automotiva 0,75cm X 2,0 Metros Fume", "acessorios-veiculos", "acessorios-veiculos"],
  ["Câmera instantânea Instax Mini 12 800 ISO Azul", "eletronicos", "eletronicos"],
  ["Suporte para Celular Veicular Magnético", "acessorios-veiculos", "acessorios-veiculos"],
  // gift cards and supplements
  ["Mochila Notebook Antifurto Impermeável", "informatica", "moda"],
  ["Tv Smart 50 Polegadas 4k Samsung", "eletrodomesticos", "eletronicos"],
  ["Secador de Cabelo Taiff Fox Ion 2100w", "eletrodomesticos", "beleza"],
  ["Roblox R$ 100 eGift (Digital)", "eletronicos", "games"],
  ["Razer Gold Digital R$ 30 (digital)", "eletronicos", "games"],
  ["Anabolic Mass 28500 3kg Profit Labs Sabor Chocolate", "esporte", "suplementos"],
  ["2 Potes Vitamina B12 Metilcobalamina - 60 Cápsulas", "esporte", "suplementos"],
]

for (const [title, from, expected] of CASES) {
  test(`${from} -> ${expected}: ${title.slice(0, 50)}`, () => {
    assert.equal(refineCategory(title, from), expected)
  })
}

test("no category stays no category", () => {
  assert.equal(refineCategory("Whisky Johnnie Walker Red Label 1L", null), null)
})

test("estável: aplicar as regras duas vezes dá o mesmo resultado (nada vai e volta entre categorias)", () => {
  for (const [title, from] of CASES) {
    const once = refineCategory(title, from)
    assert.equal(refineCategory(title, once), once, `${title}: ${from} -> ${once} -> ${refineCategory(title, once)}`)
  }
})

test("ferramenta com ponta imantada continua ferramenta; ímã de verdade vai para indústria", () => {
  assert.equal(refineCategory("KIT 12 Chaves De Fenda E Philips Conjunto Ponta Imantada Ímã", "ferramentas"), "ferramentas")
  assert.equal(refineCategory("Martelo manual com imã Lotus", "industria"), "ferramentas")
  assert.equal(refineCategory("Ímã Neodímio Ø 6x2 Mm N35 100 Unidades", "ferramentas"), "industria")
})
