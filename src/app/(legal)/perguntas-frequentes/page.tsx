import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: "Respostas rápidas sobre preços, compras, favoritos e conta no E-Zoom.",
}

const EMAIL = "aflservicos2026@gmail.com"

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "O E-Zoom vende produtos?",
    a: "Não. Reunimos ofertas de lojas parceiras. A compra, o pagamento e a entrega acontecem no site da loja.",
  },
  {
    q: "Pago algo a mais por comprar pelo E-Zoom?",
    a: "Não. O preço é o mesmo da loja. Se você comprar pelo nosso link, a loja pode pagar uma comissão ao E-Zoom, sem custo extra para você.",
  },
  {
    q: "O preço da loja pode ser diferente do que aparece aqui?",
    a: "Pode. Os preços mudam o tempo todo e nós os atualizamos periodicamente. O valor que vale é o que aparece na página da loja na hora da compra.",
  },
  {
    q: "O que significa \"menor preço que registramos\"?",
    a: "É o menor valor que o E-Zoom observou para aquele produto desde que começou a acompanhá-lo. Só aparece quando temos dados para afirmar isso, e não é uma garantia de que é o menor preço da internet.",
  },
  {
    q: "Preciso criar conta?",
    a: "Não. Você pode buscar, favoritar e abrir ofertas sem conta. A conta é opcional e serve para manter seus favoritos iguais em todos os aparelhos.",
  },
  {
    q: "Onde ficam meus favoritos?",
    a: "Sem conta, ficam salvos no seu aparelho. Com conta, também ficam guardados nela e aparecem em qualquer aparelho em que você entrar.",
  },
  {
    q: "Uma oferta apareceu como indisponível. E agora?",
    a: "Ofertas podem acabar ou mudar de preço na loja. Quando isso acontece, ela some da lista ou aparece como indisponível nos seus favoritos.",
  },
  {
    q: "Como excluo minha conta?",
    a: (
      <>
        Envie um pedido para <a href={`mailto:${EMAIL}`}>{EMAIL}</a> usando o e-mail da conta. Removemos a conta e os
        favoritos em até 15 dias. Veja mais na <Link href="/privacidade">Política de Privacidade</Link>.
      </>
    ),
  },
  {
    q: "Como falo com vocês?",
    a: (
      <>
        Escreva para <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </>
    ),
  },
]

export default function FaqPage() {
  return (
    <>
      <h1>Perguntas frequentes</h1>
      {FAQ.map(({ q, a }) => (
        <section key={q}>
          <h2>{q}</h2>
          <p>{a}</p>
        </section>
      ))}
      <p>
        Quer entender melhor o processo? Veja <Link href="/como-funciona">como funciona</Link>.
      </p>
    </>
  )
}
