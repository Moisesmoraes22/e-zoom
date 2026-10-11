import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sobre o E-Zooom",
  description: "Quem somos, o que o E-Zooom faz e como mantemos as informações de preço confiáveis.",
}

export default function AboutPage() {
  return (
    <>
      <h1>Sobre o E-Zooom</h1>
      <p>
        O E-Zooom é um hub de ofertas: reunimos em um só lugar promoções de lojas como Mercado Livre, Shopee e Amazon,
        para você comparar preços e ir direto à oferta. A compra é sempre finalizada na loja; nós não vendemos, não
        entregamos e não processamos pagamentos.
      </p>

      <h2>O que fazemos</h2>
      <ul>
        <li>Buscamos ofertas nas lojas parceiras e atualizamos os preços várias vezes ao dia.</li>
        <li>Registramos o histórico de preços para você ver se uma queda é de verdade.</li>
        <li>Separamos as ofertas por categoria e reunimos cupons com a validade informada pela loja.</li>
      </ul>

      <h2>Nosso compromisso com a informação</h2>
      <p>
        Só mostramos o que conseguimos comprovar: o preço que a loja informa, o que registramos ao longo do tempo e a
        data em que vimos a oferta. Quando não sabemos até quando uma promoção vale, não inventamos prazo, estoque ou
        quantidade de interessados. Preços e disponibilidade podem mudar na loja a qualquer momento.
      </p>

      <h2>Como o site se mantém</h2>
      <p>
        Usamos links de afiliado: se você comprar depois de clicar, a loja pode pagar uma comissão ao E-Zooom,{" "}
        <strong>sem custo extra para você</strong>. Isso não altera o preço nem a ordem em que as ofertas aparecem.
        Também podemos exibir anúncios do Google AdSense, sempre identificados como anúncio.
      </p>

      <p>
        Veja <Link href="/como-funciona">como funciona</Link>, as <Link href="/perguntas-frequentes">perguntas
        frequentes</Link> ou fale com a gente em <Link href="/contato">contato</Link>.
      </p>
    </>
  )
}
