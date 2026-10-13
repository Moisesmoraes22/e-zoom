import assert from "node:assert/strict"
import { test } from "node:test"

import { refineCategory } from "../lib/categories.ts"

// [title, category the store gave, category it must end up in]. Every mistake found in a
// review goes here, so it can never come back. Add a row whenever a new one is found.
const CASES: [string, string, string][] = [
  // complete assembled PCs get their own category; parts and furniture stay where they are
  ["Pc Gamer Completo Intel Core I5 16gb Ssd 480gb Monitor 24 Teclado Mouse", "informatica", "pc-completo"],
  ["Kit Pc Gamer Completo Ryzen 5 Ssd + Cadeira Gamer", "casa", "pc-completo"],
  ["Computador Completo Intel I3 4gb Hd 500gb Monitor 19", "informatica", "pc-completo"],
  ["Cpu Gamer Ryzen 5 5600g 16gb Ssd 480gb", "informatica", "pc-completo"],
  ["Mini Pc Intel N100 8gb Ssd 256gb Windows 11", "eletronicos", "pc-completo"],
  ["Gabinete Pc Gamer Atx Rgb Com 4 Fans Vidro Temperado", "informatica", "informatica"],
  ["Mesa Para Computador Gamer Escrivaninha Com Prateleira", "casa", "casa"],
  ["Suporte Para Cpu Gabinete Com Rodinhas", "informatica", "informatica"],
  ["Notebook Gamer Acer Nitro 5 Intel Core I5 16gb", "informatica", "informatica"],
  ["Cooler Para Pc Gamer Rgb 120mm", "informatica", "informatica"],
  ["Workstation Yamaha Montage 8 - Sintetizador", "pc-completo", "instrumentos"],
  ["Workstation Dell Precision Intel Xeon 32gb Ssd 1tb", "informatica", "informatica"],
  ["Pc Workstation Intel Core I9 64gb Ssd 2tb Rtx 4070", "informatica", "pc-completo"],
  // fragrances leave "beleza"; room/car scents and care products stay
  ["Perfume Lattafa Asad Eau De Parfum 100ml Masculino", "beleza", "perfumes"],
  ["Natura Kaiak Aventura Desodorante Colônia Masculino 100ml", "beleza", "perfumes"],
  ["Malbec Desodorante Colônia O Boticário 100ml", "beleza", "perfumes"],
  ["Body Splash Victoria's Secret Love Spell 250ml", "beleza", "perfumes"],
  ["Aromatizador De Ambiente Difusor Varetas Perfume Lavanda", "beleza", "beleza"],
  ["Perfume Para Carro Automotivo Aromatizante", "casa", "casa"],
  ["Penteadeira Suspensa Espelho Paraty Malbec", "casa", "casa"],
  ["Seringa e Adaptador Kit Com Extrator Para Transferir Perfume Decant Frasco", "perfumes", "beleza"],
  ["100 Frascos Vidro Spray 5ml Para Perfume Decant Amostra Atacado", "beleza", "beleza"],
  ["Kit 3 6 ou 12 Frasco Perfume Viagem 5ml Recarregável Atomizador Spray", "perfumes", "beleza"],
  ["Perfume Hello Kitty Estilosa Jequiti 25ml Desodorante Colônia Feminina", "perfumes", "perfumes"],
  ["Kit 3x Algodão 100un Quadrado Bebê Sem Perfume Limpeza Macio", "beleza", "beleza"],
  ["Base Desinfetante Concentrada Rende até 30L com Perfume Premium", "beleza", "beleza"],
  ["Natura Todo Dia Hidratante Corporal Creme 400ml", "beleza", "beleza"],
  ["Sabonete Natura Ekos Castanha 150g", "beleza", "beleza"],
  // books: manga and Bibles open the title; merch about them does not count
  ["Mangá One Piece Vol. 1 Panini", "brinquedos", "livros"],
  ["Bíblia Sagrada NVI Letra Grande Capa Dura", "casa", "livros"],
  ["Livro Hábitos Atômicos James Clear", "moda", "livros"],
  ["Box Harry Potter 7 Livros Capa Dura", "brinquedos", "livros"],
  ["Capa Para Bíblia Feminina Com Zíper", "moda", "moda"],
  ["Porta Livros Estante Suporte Ajustável", "casa", "casa"],
  ["Camiseta Naruto Mangá Preta Algodão", "moda", "moda"],
  ["Kit com 2, 6 ou 8 Blusas Manga Curta Infantil Algodão", "brinquedos", "brinquedos"],
  ["Manga Palmer Polpa Congelada 1kg", "alimentos-bebidas", "alimentos-bebidas"],
  // dermocosmetics and herbs get their own categories; make-up, devices and party "cha" stay
  ["La Roche-Posay Effaclar Gel De Limpeza Facial 400g", "beleza", "dermocosmeticos"],
  ["Protetor Solar Facial Fps 70 Anthelios Uvmune 400", "beleza", "dermocosmeticos"],
  ["Sérum Vitamina C Principia Antioxidante 30ml", "beleza", "dermocosmeticos"],
  ["Hidratante Facial Cerave Pele Normal A Seca 454g", "saude", "dermocosmeticos"],
  ["Pincel Para Maquiagem Aplicador De Sérum Facial", "beleza", "beleza"],
  ["Rolo Massageador Facial Jade Gua Sha", "beleza", "beleza"],
  ["Chá De Camomila Caixa Com 10 Sachês", "alimentos-bebidas", "ervas-naturais"],
  ["Óleo Essencial De Lavanda 10ml 100% Puro", "casa", "ervas-naturais"],
  ["Própolis Verde Extrato 30ml", "saude", "ervas-naturais"],
  ["Chá De Bebê Kit Decoração Festa", "festas", "festas"],
  ["Jogo De Chá Xícaras Bule Porcelana", "casa", "casa"],
  ["Difusor Aromatizador Óleo Essencial Ultrassônico", "casa", "casa"],
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
  // personal hygiene
  ["Creme Dental Colgate Total 12 Clean Mint 90g", "beleza", "higiene-cuidados"],
  ["Desodorante Aerosol Rexona Masculino Active 150ml", "beleza", "higiene-cuidados"],
  ["Kit 3 Escova Dental Oral-B Indicator Macia", "casa", "higiene-cuidados"],
  ["Absorvente Always Noites Tranquilas com Abas 8 unidades", "saude", "higiene-cuidados"],
  ["Aparelho de Barbear Gillette Prestobarba3 com 4 unidades", "beleza", "higiene-cuidados"],
  ["Saboneteira Porta Sabonete Parede Inox", "casa", "casa"],
  ["Base Para Sabonete Artesanal Glicerina Branca 1kg", "arte-papelaria", "arte-papelaria"],
  ["Desodorante de Ambiente Aerosol Lavanda 360ml", "casa", "casa"],
  // pet shop
  ["Ração Premier Pet Cães Adultos Raças Pequenas 15kg", "alimentos-bebidas", "animais"],
  ["Antipulgas Bravecto Cães 10 a 20kg", "saude", "animais"],
  ["Shampoo Neutro Para Cachorro e Gatos 500ml", "beleza", "animais"],
  ["Cama Para Gatos Redonda Pelúcia Antiderrapante", "casa", "animais"],
  ["Cama Box Casal Queen Colchão Ortopédico", "casa", "casa"],
  ["Fonte de Alimentação 12v 5a Bivolt", "ferramentas", "ferramentas"],
  ["Peitoral Academia Supino Halter 20kg", "esporte", "esporte"],
  ["Sachê Cachorro Quente Tempero Molho 200g", "alimentos-bebidas", "alimentos-bebidas"],
  // make-up brushes and jewellery
  ["Kit 12 Pincéis de Maquiagem Profissional Esfumar Base Pó Blush", "casa", "beleza"],
  ["Pincel Kabuki Para Base Líquida e Pó Compacto", "moda", "beleza"],
  ["Pincel Para Pintura Artística Aquarela Kit 10 Peças", "arte-papelaria", "arte-papelaria"],
  ["Pincel de Silicone Culinário Para Confeitaria", "casa", "casa"],
  ["Cordão Masculino Prata 925 Groumet 60cm", "moda", "joias-relogios"],
  ["Anel Feminino Folheado A Ouro 18k Solitário", "beleza", "joias-relogios"],
  ["Kit 3 Pulseiras Masculinas Couro Trançado", "moda", "joias-relogios"],
  ["Pulseira Para Apple Watch Series 9 Silicone", "moda", "moda"],
  ["Cordão Para Celular Lanyard Pescoço", "moda", "moda"],
  ["Anel De Vedação Borracha O-ring Kit", "casa", "casa"],
  ["Corrente Galvanizada 8mm Elo Curto 10 Metros", "casa", "casa"],
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
  // phone accessories have their own category
  ["Capa Silicone Aveludada Para Samsung Galaxy A05s, A15 e A55", "celulares", "acessorios-celular"],
  ["Película de Vidro 3D Privacidade Para iPhone 13", "celulares", "acessorios-celular"],
  ["Cabo USB-C para USB-A de 1,5 Metros Azul, Pioneer", "celulares", "acessorios-celular"],
  ["Carregador Portátil Power Bank 20000mah Turbo", "celulares", "acessorios-celular"],
  ["Kit 3 Capinhas Anti Impacto Motorola Moto G54", "celulares", "acessorios-celular"],
  ["Suporte Veicular Magnético Para Celular", "celulares", "acessorios-celular"],
  ["Protetor Câmera iPhone 15 Pro/15 Pro Max Gshield Glitter", "celulares", "acessorios-celular"],
  ["Microfone Direcional Godox GeniusMic para Smartphone", "celulares", "acessorios-celular"],
  ["Fone Bluetooth Tws Lenyes Anc Profissional Para Celular Poco X7", "celulares", "acessorios-celular"],
  ["Gaveta Bandeja Chip Sim Card Moto G35 5g Xt2433", "celulares", "acessorios-celular"],
  ["Smartphone Motorola Moto G06 128GB com Capa e Película", "celulares", "celulares"],
  ["Apple iPhone 15 (128 GB) - Preto", "celulares", "celulares"],
  ["Samsung Galaxy A55 5G 256GB", "celulares", "celulares"],
  // ...and what only MENTIONS the product stays where it is (a case is now an accessory, not a phone)
  ["Capa para Celular Samsung Galaxy A15 Silicone", "celulares", "acessorios-celular"],
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
