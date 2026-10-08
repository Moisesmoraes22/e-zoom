import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade" }

const EMAIL = "aflservicos2026@gmail.com"

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p>Última atualização: 8 de outubro de 2026.</p>
      <p>
        Esta política explica quais dados o E-Zoom coleta, para quê, e como você pode exercer seus direitos
        previstos na Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).
      </p>

      <h2>1. Quem é o responsável</h2>
      <p>
        <strong>E-Zoom</strong> é o controlador dos dados tratados neste site. Contato:{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
      </p>

      <h2>2. O que o site é</h2>
      <p>
        O E-Zoom é um hub de ofertas. Não vendemos produtos nem processamos pagamentos: ao clicar em &quot;Ver
        oferta&quot; você é levado ao site da loja (Amazon, Mercado Livre ou Shopee), que trata seus dados conforme
        a política própria.
      </p>

      <h2>3. Navegando sem conta</h2>
      <p>
        Você pode usar o site, buscar, favoritar e clicar em ofertas sem criar conta. Nesse caso não coletamos nome,
        e-mail nem outros dados pessoais. Seu navegador guarda, apenas no seu aparelho:
      </p>
      <ul>
        <li>seus favoritos (título, imagem, preço, loja e link das ofertas);</li>
        <li>a escolha de tema claro/escuro e suas últimas buscas;</li>
        <li>
          seus interesses: o que você buscou, abriu, clicou em &quot;Ver oferta&quot; ou favoritou (categoria e palavras do
          produto), usados para mostrar a seção &quot;Recomendado para você&quot;.
        </li>
      </ul>
      <p>
        <strong>Seus interesses ficam só no seu navegador.</strong> Eles não são enviados para nós, para a Vercel, para o
        Supabase nem para as lojas, e perdem peso sozinhos com o passar dos dias (guardamos até 150 ações). Para apagar
        tudo, use o botão &quot;Limpar meus interesses&quot; na seção &quot;Recomendado para você&quot; da página inicial, ou limpe
        os dados do site no navegador.
      </p>
      <p>
        Você pode apagar esses dados a qualquer momento limpando os dados do site no navegador. Não usamos
        publicidade.
      </p>

      <h2>4. Estatísticas de visitas</h2>
      <p>
        Medimos quantas pessoas visitam o site, quais páginas são mais vistas, de onde vêm (por exemplo, Google ou
        redes sociais), o tipo de aparelho e o navegador, para melhorar o site. Usamos o Vercel Web Analytics, que
        funciona <strong>sem cookies</strong> e sem identificar você: os dados são agregados e não incluem seu nome,
        e-mail nem o conteúdo dos seus favoritos. Base legal: legítimo interesse.
      </p>
      <p>
        Também contamos quantas vezes cada oferta é aberta pelo botão “Ver oferta”, para mostrar quais ofertas estão
        em alta. Cada contagem guarda apenas qual oferta foi aberta, em que parte do site e quando: não guardamos
        seu endereço IP, seu aparelho, sua conta nem qualquer dado que identifique você.
      </p>

      <p>
        <strong>Microsoft Clarity (somente se você aceitar).</strong> Na primeira visita perguntamos se você aceita que
        usemos o Microsoft Clarity, uma ferramenta que registra como as páginas são usadas (cliques, rolagem e
        movimentos do mouse) e gera mapas de calor, usando cookies. Serve para entendermos o que atrapalha o uso do
        site. Senhas e campos sensíveis são ocultados pela própria ferramenta, e não a usamos para identificar você.
        Se você recusar, o Clarity não é carregado e nada muda no uso do site. Você pode mudar de ideia a qualquer
        momento em &quot;Preferências de cookies&quot;, no rodapé. Base legal: consentimento. Os dados são tratados pela
        Microsoft, que pode armazená-los fora do Brasil.
      </p>

      <h2>5. Criando uma conta (opcional)</h2>
      <p>
        A conta serve para manter seus favoritos iguais em todos os aparelhos e para você comentar nas ofertas. Ao se
        cadastrar, tratamos:
      </p>
      <ul>
        <li>
          <strong>e-mail</strong> e <strong>senha</strong> (a senha é guardada de forma criptografada pelo provedor
          de autenticação; nós nunca a vemos);
        </li>
        <li>
          <strong>nome</strong>, se você o informar;
        </li>
        <li>
          <strong>favoritos</strong> (somente a identificação da oferta e a data em que foi salva);
        </li>
        <li>
          <strong>comentários, fotos e vídeos</strong> que você decidir publicar, e as denúncias que você fizer sobre
          comentários de outras pessoas (veja a seção 5-A);
        </li>
        <li>
          dados técnicos da sessão (como datas de acesso e, em registros de segurança, endereço IP e navegador),
          mantidos pelo provedor de autenticação.
        </li>
      </ul>
      <p>
        Não coletamos telefone, endereço, data de nascimento, CPF, dados de pagamento nem foto de perfil. As únicas
        fotos e vídeos que recebemos são os que você escolhe anexar a um comentário.
      </p>

      <h2>5-A. Comentários, fotos e vídeos</h2>
      <ul>
        <li>
          <strong>O que aparece para todos:</strong> o texto do comentário, as fotos e o vídeo, a data e o seu{" "}
          <strong>primeiro nome</strong> (ou &quot;Cliente E-Zoom&quot; se você não informou nome). Seu e-mail nunca é
          mostrado. O que você publica pode ser visto por qualquer pessoa que abra a página da oferta.
        </li>
        <li>
          <strong>Localização nos arquivos:</strong> antes do envio, as fotos são recriadas pelo seu navegador e o vídeo
          (MP4 ou MOV) tem os dados de localização e do aparelho apagados do arquivo. Não conseguimos remover o que
          aparece dentro da própria imagem ou vídeo (rostos, endereços, placas): não publique esse tipo de conteúdo.
        </li>
        <li>
          <strong>Denúncias:</strong> guardamos quem denunciou, qual comentário e o motivo, apenas para evitar abusos
          e analisar o caso. A pessoa denunciada não vê quem denunciou.
        </li>
        <li>
          <strong>Moderação:</strong> o administrador do site pode ler, ocultar ou excluir comentários, fotos e
          vídeos, principalmente os denunciados.
        </li>
        <li>
          <strong>Base legal:</strong> execução do serviço que você solicitou (publicar o comentário) e legítimo
          interesse (segurança e moderação).
        </li>
        <li>
          <strong>Quanto tempo ficam:</strong> enquanto o comentário existir. Você pode excluí-lo quando quiser, e ao
          excluir a conta os comentários, fotos e vídeos também são removidos.
        </li>
      </ul>

      <h2>6. Para que usamos e em que base legal</h2>
      <ul>
        <li>Criar e manter sua conta, confirmar seu e-mail e recuperar sua senha: execução do serviço que você solicitou.</li>
        <li>Sincronizar seus favoritos: execução do serviço que você solicitou.</li>
        <li>Segurança e prevenção de abuso (limites de tentativas, registros de acesso, moderação): legítimo interesse.</li>
        <li>
          Verificar se a senha que você escolhe já apareceu em vazamentos de dados: legítimo interesse (segurança da
          sua conta). Veja a seção 7.
        </li>
      </ul>
      <p>Não vendemos nem compartilhamos seus dados para publicidade.</p>

      <h2>7. Com quem os dados passam</h2>
      <ul>
        <li>
          <strong>Supabase</strong>: autenticação, banco de dados da conta e armazenamento das fotos e vídeos dos
          comentários.
        </li>
        <li>
          <strong>Vercel</strong>: hospedagem do site, registros técnicos de acesso e estatísticas de visitas.
        </li>
        <li>
          <strong>Microsoft (Clarity)</strong>: apenas se você aceitar o aviso de cookies, como explicado na seção 4.
        </li>
        <li>
          <strong>Have I Been Pwned (Pwned Passwords)</strong>: ao criar ou trocar a senha, seu navegador envia apenas
          os 5 primeiros caracteres de um código (hash) calculado a partir da senha, para saber se ela já vazou. A senha
          em si nunca sai do seu navegador e o serviço não consegue saber qual é.
        </li>
        <li>
          <strong>Lojas parceiras</strong> (Amazon, Mercado Livre, Shopee): recebem você apenas quando clica em uma
          oferta, e podem identificar que a visita veio do E-Zoom por meio do link de afiliado.
        </li>
      </ul>
      <p>
        Esses provedores podem armazenar dados em servidores fora do Brasil. Nesse caso, a transferência ocorre para
        prestar o serviço e com as garantias exigidas pela LGPD.
      </p>

      <h2>8. Cookies e armazenamento local</h2>
      <p>
        Usamos o necessário: um cookie de sessão (quando você entra na conta) e o armazenamento local do navegador
        descrito acima, incluindo a sua escolha sobre cookies. Não usamos cookies de publicidade. Cookies de análise
        (do Microsoft Clarity) só são usados se você aceitar o aviso, e você pode mudar a escolha em
        &quot;Preferências de cookies&quot;, no rodapé.
      </p>

      <h2>9. Por quanto tempo guardamos</h2>
      <p>
        Mantemos os dados da conta enquanto ela existir. Ao excluir a conta, o e-mail, o nome, os favoritos, os
        comentários, as fotos e os vídeos são removidos. Registros técnicos de segurança podem ser mantidos pelos provedores pelo prazo que eles definem.
      </p>

      <h2>10. Seus direitos</h2>
      <p>
        Você pode pedir confirmação de que tratamos seus dados, acesso, correção, exclusão, portabilidade e
        informações sobre o compartilhamento, além de revogar consentimentos. Para qualquer pedido, escreva para{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a> usando o e-mail da conta.
      </p>
      <p>
        <strong>Exclusão da conta:</strong> por enquanto é feita manualmente. Envie o pedido ao e-mail acima e
        removeremos sua conta, seus favoritos e seus comentários em até 15 dias. Para excluir apenas um comentário,
        use o botão &quot;Excluir&quot; nele mesmo.
      </p>

      <h2>11. Crianças</h2>
      <p>O site não é direcionado a menores de 13 anos, e não pedimos dados de crianças.</p>

      <h2>12. Mudanças nesta política</h2>
      <p>
        Podemos atualizar esta política. A data no topo mostra a última versão, e mudanças relevantes serão avisadas
        no site.
      </p>

      <h2>13. Reclamações</h2>
      <p>
        Se achar que seus dados foram tratados de forma inadequada, fale conosco primeiro. Você também pode recorrer
        à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>
    </>
  )
}
