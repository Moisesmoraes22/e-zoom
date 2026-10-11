import type { Metadata } from "next"
import Link from "next/link"

const EMAIL = "aflservicos2026@gmail.com"

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o E-Zooom: dúvidas, sugestões, oferta com preço errado ou pedido de remoção.",
}

export default function ContactPage() {
  return (
    <>
      <h1>Contato</h1>
      <p>
        O atendimento do E-Zooom é por e-mail:{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>

      <h2>Quando escrever</h2>
      <ul>
        <li>Encontrou uma oferta com preço, imagem ou link errado.</li>
        <li>Quer sugerir um produto, uma loja ou uma categoria.</li>
        <li>Dúvidas sobre privacidade, cookies ou seus dados (veja a <Link href="/privacidade">política de privacidade</Link>).</li>
        <li>É lojista ou marca e quer solicitar a remoção ou a correção de uma oferta.</li>
      </ul>

      <h2>Importante</h2>
      <p>
        Pedidos, entregas, trocas e garantias são tratados diretamente com a loja onde a compra foi feita; o E-Zooom
        não vende produtos e não tem acesso aos seus pedidos. Para ajudar mais rápido, envie o link da página da
        oferta no E-Zooom.
      </p>
    </>
  )
}
