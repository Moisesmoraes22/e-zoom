import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Termos de Uso" }

const EMAIL = "aflservicos2026@gmail.com"

export default function TermsPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p>Última atualização: 8 de outubro de 2026.</p>
      <p>Ao usar o E-Zoom você concorda com estes termos. Se não concordar, não utilize o site.</p>

      <h2>1. O que é o E-Zoom</h2>
      <p>
        O E-Zoom é um hub que reúne ofertas de lojas parceiras (Amazon, Mercado Livre e Shopee). Não somos
        loja: não vendemos, não entregamos e não processamos pagamentos.
      </p>

      <h2>2. Compras acontecem nas lojas</h2>
      <p>
        Ao clicar em &quot;Ver oferta&quot; você é levado ao site da loja, onde faz a compra. Preço, estoque, prazo,
        entrega, garantia, troca e atendimento são de responsabilidade exclusiva da loja e do vendedor.
      </p>

      <h2>3. Links de afiliado</h2>
      <p>
        Como Associado da Amazon, o E-Zoom ganha com compras qualificadas. Também participamos do programa de
        afiliados do Mercado Livre e podemos receber comissão pelas compras feitas pelos nossos links, sem custo
        extra para você.
      </p>

      <h2>4. Preços e disponibilidade</h2>
      <p>
        Os preços e as informações exibidos são coletados das lojas e podem mudar a qualquer momento, ficando
        desatualizados ou indisponíveis. O valor válido é sempre o exibido na página da loja no momento da compra.
        Informações como &quot;menor preço registrado&quot; referem-se apenas ao histórico que o E-Zoom conseguiu
        registrar.
      </p>

      <h2>5. Conta (opcional)</h2>
      <p>
        A conta é opcional e serve para sincronizar seus favoritos e para comentar nas ofertas. Você é responsável por manter sua senha em
        segredo e por informar um e-mail válido. Podemos suspender contas usadas de forma abusiva ou para tentar
        prejudicar o site. Para excluir sua conta, veja a <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>6. Comentários, fotos e vídeos</h2>
      <p>
        Quem tem conta pode comentar nas ofertas e anexar fotos e um vídeo curto. O que você publica fica visível
        para qualquer visitante do site.
      </p>
      <ul>
        <li>
          <strong>Você é o responsável</strong> pelo que publica. Envie apenas conteúdo seu (texto, fotos e vídeos que
          você mesmo fez) e que descreva sua experiência com o produto ou o vendedor. Os comentários são opiniões dos
          usuários, não do E-Zoom, e não verificamos se o autor comprou o produto.
        </li>
        <li>
          <strong>Não publique:</strong> ofensas, discriminação, ameaças, conteúdo sexual, violento ou ilegal;
          propaganda, spam ou links para outros sites de venda; dados pessoais seus ou de outras pessoas (telefone,
          endereço, documentos, e-mail) e imagens de pessoas que não autorizaram; conteúdo de terceiros protegido por
          direitos autorais.
        </li>
        <li>
          <strong>Licença:</strong> você continua sendo o autor. Ao publicar, você nos autoriza, sem custo e sem
          exclusividade, a armazenar e exibir o conteúdo no E-Zoom enquanto ele estiver publicado.
        </li>
        <li>
          <strong>Moderação:</strong> o comentário aparece na hora, sem revisão prévia. Qualquer usuário logado pode
          denunciá-lo; quando três pessoas diferentes denunciam, ele sai do ar até ser analisado. Podemos ocultar ou
          excluir qualquer conteúdo que viole estes termos e suspender contas que o façam de forma repetida.
        </li>
        <li>
          <strong>Limites técnicos:</strong> até 5 comentários por hora, 3 fotos e 1 vídeo (MP4 ou MOV, até 20
          segundos e 15 MB) por comentário. Antes do envio, as fotos são recriadas e a localização gravada nos
          arquivos é apagada; ainda assim, não publique imagens que mostrem seu endereço ou outros dados pessoais.
        </li>
        <li>
          <strong>Exclusão:</strong> você pode excluir seus comentários a qualquer momento. Ao excluir sua conta, seus
          comentários, fotos e vídeos também são removidos.
        </li>
        <li>
          <strong>Denúncias e remoção:</strong> para pedir a remoção de um conteúdo (por exemplo, por violar seus
          direitos ou sua privacidade), escreva para <a href={`mailto:${EMAIL}`}>{EMAIL}</a> com o endereço da página e
          o motivo. Cumprimos também ordens judiciais, nos termos do Marco Civil da Internet.
        </li>
      </ul>

      <h2>7. Uso adequado</h2>
      <p>É proibido:</p>
      <ul>
        <li>tentar acessar áreas ou dados que não são seus, ou burlar medidas de segurança;</li>
        <li>coletar o conteúdo do site em massa por meios automatizados sem autorização;</li>
        <li>usar o site para fraude, spam ou qualquer atividade ilegal.</li>
      </ul>

      <h2>8. Propriedade intelectual</h2>
      <p>
        O código, o design e a marca E-Zoom pertencem aos seus titulares. Nomes, imagens e marcas de produtos e
        lojas pertencem aos respectivos donos e são exibidos apenas para identificar as ofertas. Os comentários,
        fotos e vídeos pertencem a quem os publicou, conforme a seção 6.
      </p>

      <h2>9. Limitação de responsabilidade</h2>
      <p>
        O site é oferecido &quot;como está&quot;. Nos esforçamos para manter as informações corretas, mas não
        garantimos que estejam sempre atualizadas nem que o site funcione sem interrupções. Não nos responsabilizamos
        por problemas decorrentes de compras feitas nas lojas parceiras, nem pelo conteúdo publicado pelos usuários,
        nos limites permitidos pela lei.
      </p>

      <h2>10. Privacidade</h2>
      <p>
        O tratamento de dados pessoais está descrito na <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>11. Mudanças e lei aplicável</h2>
      <p>
        Podemos alterar estes termos; a data no topo indica a versão mais recente. Estes termos seguem as leis do
        Brasil.
      </p>

      <h2>12. Contato</h2>
      <p>
        Dúvidas: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>
    </>
  )
}
