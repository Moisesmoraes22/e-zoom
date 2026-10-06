import assert from "node:assert/strict"
import { test } from "node:test"

import { isDj } from "../lib/dj.ts"
import { guessCategory } from "../lib/message-parser.ts"

const YES = [
  "Controladora DJ Pioneer DDJ-FLX4 2 Canais Rekordbox Serato",
  "Pioneer DJ XDJ-RX3 All-in-one Sistema DJ",
  "CDJ-3000 Multi Player Profissional Pioneer",
  "Mixer DJ Numark Scratch 2 Canais",
  "Toca Discos Technics SL-1200 Direct Drive",
  "Fone de Ouvido DJ Profissional HDJ-X5 Pioneer",
  "Cabo XLR Balanceado 5 Metros Microfone",
  "Plug XLR Macho Fêmea Conector Neutrik",
  "Cabo P10 Instrumento 3m Guitarra Violão",
  "Interface de Áudio USB Behringer UMC22",
  "Mesa de Som Behringer Xenyx 12 Canais",
  "Caixa Ativa 15 Polegadas 500W Bluetooth",
  "Moving Head LED 60W DMX Efeito de Luz",
  "Máquina de Fumaça 1500W Controle Sem Fio",
  "Case para Controladora DJ Mixer Bag",
  "Pedestal para Caixa de Som Tripé Suporte",
  "Microfone Dinâmico Profissional Shure SM58",
]
const NO = [
  "Fantasia DJ Infantil Festa Neon",
  "Boneco DJ Musical Brinquedo Luzes",
  "Mixer Elétrico Portátil 2 em 1 Recarregável Misturador de Bebidas",
  "Ventilador de Pedestal 40cm 6 Pás",
  "Mesinha Infantil Kids Baby Hercules 2 Cadeiras",
  "Controle Sem Fio PS5 DualSense",
  "Cabo HDMI 3 Metros 2.1 8k",
  "Camiseta DJ Party Masculina",
  "Headset Gamer DJ RGB 7.1",
  "Pneu Rinaldi 80/90-21 RT36 Dianteiro Lander Tenere XTZ125 DT180 NX 200 XLR uso comum",
]

for (const t of YES) test(`DJ: ${t.slice(0, 50)}`, () => assert.equal(isDj(t), true, t))
for (const t of NO) test(`not DJ: ${t.slice(0, 50)}`, () => assert.equal(isDj(t), false, t))

test("telegram guess sends DJ gear to the dj category", () => {
  assert.equal(guessCategory("Controladora DJ Pioneer DDJ-FLX4"), "dj")
  assert.equal(guessCategory("Caixa Ativa 15 Polegadas 500W"), "dj")
  assert.equal(guessCategory("Mixer Elétrico Portátil 2 em 1"), null)
})

// Real titles from the Shopee feed that the first, broader rule let in by mistake.
for (const t of [
  "Mesa de Jantar Raquel com Tampo de Vidro 80,6x170x90cm DJ Móveis",
  "Home para TV 75 Gama DJ Móveis",
  "Dj Bouncy Beats Pular E Aprender Falar 3 idiomas Fisher-price - Mattel",
  "Suspensão Garfo Aro 26 Mtb Absolute Brutus Dj 100mm",
  "Caixa Disjuntor Polifasica Cdj3 Padrao Taf",
  "Cabo RCA 5 Metros Emborrachado Automotivo Som Profissional Carro Cobre Puro",
  "Mesa De Som Automotivo Stetsom 12v 2 Canais Stereo Stm0602",
  "Modulo Amplificador Taramps Ts400x4 400 Watts Rms + 02 Cabo Rca 1,5 Metros",
  "Microfone Lapela Boya By-v20 p/iPhone 15 e Android Rosa",
  "Hollyland LARK A1 Mini Duo Combo Microfone Sem Fio Mini para iPhone 15/16",
  "Cabo de Áudio Ugreen 3.5mm Macho/Fêmea 1 Metro Preto",
  "Kit Contrabaixo Elétrico Winner Wjb 4 Cordas C/Capa + Correia Cabo P10/P10",
  "Par LED DRL Daylight Toyota Yaris Hatch e Sedan",
  "Rádio Comunicador Bidirecional Uv5r Ht Dual Band 12km Uhf Vhf Fone Profissional",
  "Kit Youtuber Com Tripe Iluminador Ring Light Celular Microfone Profissional",
]) {
  test(`not DJ (feed): ${t.slice(0, 55)}`, () => assert.equal(isDj(t), false, t))
}
for (const t of [
  "Cabo RCA Profissional 5m 100% Cobre Malha Náutica Ophera",
  "BOMGE Interface Mixer de Áudio DJ 6 Canais Profissional MP3 USB Bluetooth",
  "Mini Globo Luz Bola Giratorio Festa Balada Dj Led Rgb Controle Remoto",
  "Mesa de Som 4 Canais Compacta Efeitos Phantom Power Knup",
  "Cabo Speak-on 10m Para Caixa De Som Ativa Passiva 10 Metros",
  "Toca Discos Audio-Technica Acionamento por Correia AT-LP60X",
  "Microfone Sem Fio Leson MIC PRO 2.0 Duplo UHF P10 Igreja Karaokê",
  "Suporte Pedestal Tripé Para Caixa Som Acústica Aúdio Profissional",
]) {
  test(`DJ (feed): ${t.slice(0, 55)}`, () => assert.equal(isDj(t), true, t))
}

// Mercado Livre titles: parts and unrelated gear out, real gear in.
for (const t of [
  "Agulha Para Numark Groovetool Tt1600 Mk2",
  "Fader Potenciômetro Pioneer Dj Mixer Djm500 600",
  "Toca-discos Le Son Retro Vintage Vermelho",
  "Sintetizador Poly D - Behringer",
  "Interface Audio Comando Volante Cruze",
  "Lanterna LED Milwaukee 18v Robust Moving Head White",
  "Amplificador Baixo Borne Gobass Gb300 + Cabo P10/p10",
]) test(`not DJ (ML): ${t.slice(0, 50)}`, () => assert.equal(isDj(t), false, t))
for (const t of [
  "Mixer para DJ Behringer MicroMix MX400",
  "Mesa Som Profissional Behringer Wing Compact 48 Canais",
  "Monitor Estudio Alesis M1 Active Mk3 65w",
  "Interface Behringer Umc22 Preto",
  "Cabo P10 Mono 5m Preto Ouro para Guitarra Baixo Violão",
]) test(`DJ (ML): ${t.slice(0, 50)}`, () => assert.equal(isDj(t), true, t))
