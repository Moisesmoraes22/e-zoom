import type { Metadata } from "next"

export const metadata: Metadata = { title: "Política de Privacidade" }

const EMAIL = "aflservicos2026@gmail.com"

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p>Última atualização: 5 de outubro de 2026.</p>
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
        <li>a escolha de tema claro/escuro e suas últimas buscas.</li>
      </ul>
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

      <h2>5. Criando uma conta (opcional)</h2>
      <p>A conta serve apenas para manter seus favoritos iguais em todos os aparelhos. Ao se cadastrar, tratamos:</p>
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
          dados técnicos da sessão (como datas de acesso e, em registros de segurança, endereço IP e navegador),
          mantidos pelo provedor de autenticação.
        </li>
      </ul>
      <p>Não coletamos telefone, endereço, data de nascimento, CPF, dados de pagamento ou foto.</p>

      <h2>6. Para que usamos e em que base legal</h2>
      <ul>
        <li>Criar e manter sua conta, confirmar seu e-mail e recuperar sua senha: execução do serviço que você solicitou.</li>
        <li>Sincronizar seus favoritos: execução do serviço que você solicitou.</li>
        <li>Segurança e prevenção de abuso (limites de tentativas, registros de acesso): legítimo interesse.</li>
      </ul>
      <p>Não vendemos nem compartilhamos seus dados para publicidade.</p>

      <h2>7. Com quem os dados passam</h2>
      <ul>
        <li>
          <strong>Supabase</strong>: autenticação e banco de dados da conta.
        </li>
        <li>
          <strong>Vercel</strong>: hospedagem do site, registros técnicos de acesso e estatísticas de visitas.
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
        Usamos apenas o necessário: um cookie de sessão (quando você entra na conta) e o armazenamento local do
        navegador descrito acima. Não usamos cookies de publicidade nem de análise.
      </p>

      <h2>9. Por quanto tempo guardamos</h2>
      <p>
        Mantemos os dados da conta enquanto ela existir. Ao excluir a conta, o e-mail, o nome e os favoritos são
        removidos. Registros técnicos de segurança podem ser mantidos pelos provedores pelo prazo que eles definem.
      </p>

      <h2>10. Seus direitos</h2>
      <p>
        Você pode pedir confirmação de que tratamos seus dados, acesso, correção, exclusão, portabilidade e
        informações sobre o compartilhamento, além de revogar consentimentos. Para qualquer pedido, escreva para{" "}
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a> usando o e-mail da conta.
      </p>
      <p>
        <strong>Exclusão da conta:</strong> por enquanto é feita manualmente. Envie o pedido ao e-mail acima e
        removeremos sua conta e seus favoritos em até 15 dias.
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
