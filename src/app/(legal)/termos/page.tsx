import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Termos de Uso" }

const EMAIL = "aflservicos2026@gmail.com"

export default function TermsPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p>Última atualização: 4 de outubro de 2026.</p>
      <p>Ao usar o HibridLink você concorda com estes termos. Se não concordar, não utilize o site.</p>

      <h2>1. O que é o HibridLink</h2>
      <p>
        O HibridLink é um hub que reúne ofertas de lojas parceiras (Amazon, Mercado Livre e Shopee). Não somos
        loja: não vendemos, não entregamos e não processamos pagamentos.
      </p>

      <h2>2. Compras acontecem nas lojas</h2>
      <p>
        Ao clicar em &quot;Ver oferta&quot; você é levado ao site da loja, onde faz a compra. Preço, estoque, prazo,
        entrega, garantia, troca e atendimento são de responsabilidade exclusiva da loja e do vendedor.
      </p>

      <h2>3. Links de afiliado</h2>
      <p>
        Como Associado da Amazon, o HibridLink ganha com compras qualificadas. Também participamos do programa de
        afiliados do Mercado Livre e podemos receber comissão pelas compras feitas pelos nossos links, sem custo
        extra para você.
      </p>

      <h2>4. Preços e disponibilidade</h2>
      <p>
        Os preços e as informações exibidos são coletados das lojas e podem mudar a qualquer momento, ficando
        desatualizados ou indisponíveis. O valor válido é sempre o exibido na página da loja no momento da compra.
        Informações como &quot;menor preço registrado&quot; referem-se apenas ao histórico que o HibridLink conseguiu
        registrar.
      </p>

      <h2>5. Conta (opcional)</h2>
      <p>
        A conta é opcional e serve para sincronizar seus favoritos. Você é responsável por manter sua senha em
        segredo e por informar um e-mail válido. Podemos suspender contas usadas de forma abusiva ou para tentar
        prejudicar o site. Para excluir sua conta, veja a <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>6. Uso adequado</h2>
      <p>É proibido:</p>
      <ul>
        <li>tentar acessar áreas ou dados que não são seus, ou burlar medidas de segurança;</li>
        <li>coletar o conteúdo do site em massa por meios automatizados sem autorização;</li>
        <li>usar o site para fraude, spam ou qualquer atividade ilegal.</li>
      </ul>

      <h2>7. Propriedade intelectual</h2>
      <p>
        O código, o design e a marca HibridLink pertencem aos seus titulares. Nomes, imagens e marcas de produtos e
        lojas pertencem aos respectivos donos e são exibidos apenas para identificar as ofertas.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        O site é oferecido &quot;como está&quot;. Nos esforçamos para manter as informações corretas, mas não
        garantimos que estejam sempre atualizadas nem que o site funcione sem interrupções. Não nos responsabilizamos
        por problemas decorrentes de compras feitas nas lojas parceiras, nos limites permitidos pela lei.
      </p>

      <h2>9. Privacidade</h2>
      <p>
        O tratamento de dados pessoais está descrito na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>10. Mudanças e lei aplicável</h2>
      <p>
        Podemos alterar estes termos; a data no topo indica a versão mais recente. Estes termos seguem as leis do
        Brasil.
      </p>

      <h2>11. Contato</h2>
      <p>
        Dúvidas: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
    </>
  )
}
