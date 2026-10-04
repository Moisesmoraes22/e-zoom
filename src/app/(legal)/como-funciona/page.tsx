import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Como funciona",
  description: "Entenda como o HibridLink encontra ofertas e como você compra nas lojas parceiras.",
}

export default function HowItWorksPage() {
  return (
    <>
      <h1>Como funciona</h1>
      <p>
        O HibridLink é um hub de ofertas: reunimos promoções de lojas como Mercado Livre e Amazon em um só lugar para
        você comparar e escolher onde comprar. Não somos uma loja.
      </p>

      <h2>1. Encontramos as ofertas</h2>
      <p>
        Nosso sistema busca ofertas nas lojas parceiras e as atualiza periodicamente. Mostramos o preço, a loja e,
        quando existe, o preço anterior.
      </p>

      <h2>2. Você escolhe</h2>
      <p>
        Use a <Link href="/busca">busca</Link>, as <Link href="/categorias">categorias</Link> e os filtros de loja e
        faixa de preço. Na página de cada produto, mostramos o histórico de preços que conseguimos registrar, para você
        ver se o valor está bom.
      </p>

      <h2>3. Você compra na loja</h2>
      <p>
        Ao clicar em &quot;Ver oferta&quot;, você vai para o site da loja e finaliza a compra lá. Pagamento, entrega,
        troca e garantia são da loja. Nós não temos carrinho nem processamos pagamentos.
      </p>

      <h2>4. Como o HibridLink ganha</h2>
      <p>
        Usamos links de afiliado. Se você comprar depois de clicar, a loja pode pagar uma comissão ao HibridLink,{" "}
        <strong>sem custo extra para você</strong>. É assim que o site se mantém, e não influencia o preço que você
        paga.
      </p>

      <h2>5. Favoritos e conta</h2>
      <p>
        Você pode favoritar ofertas sem criar conta; elas ficam salvas no seu aparelho. Se criar uma conta
        (opcional), seus favoritos acompanham você em todos os aparelhos.
      </p>

      <p>
        Ficou com dúvida? Veja as <Link href="/perguntas-frequentes">perguntas frequentes</Link>.
      </p>
    </>
  )
}
