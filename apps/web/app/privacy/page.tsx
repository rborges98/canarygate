import type { Metadata } from 'next'
import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'

export const metadata: Metadata = {
  title: 'Política de Privacidade — CanaryGate',
  description:
    'Como o CanaryGate coleta, usa e protege seus dados pessoais, em conformidade com a LGPD (Lei nº 13.709/2018).'
}

export default function PrivacyPage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-8">
        <div className="border-cg-bg-100 mb-12 border-b pb-8">
          <h1 className="text-cg-neutral-100 text-3xl font-bold">
            Política de Privacidade
          </h1>
          <p className="text-cg-neutral-500 mt-3 text-sm">
            Versão 1.0 &mdash; Data de vigência:{' '}
            <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
              [DATA: A PREENCHER]
            </span>
          </p>
          <p className="text-cg-neutral-400 mt-3 text-sm leading-relaxed">
            Esta Política descreve como tratamos os dados pessoais dos usuários
            da plataforma CanaryGate, em conformidade com a{' '}
            <span className="text-cg-neutral-300">
              Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 —
              LGPD)
            </span>
            , o Marco Civil da Internet (Lei nº 12.965/2014) e demais
            legislações aplicáveis.
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              1. Identificação do Controlador
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                O controlador dos dados pessoais tratados por meio deste Serviço
                é:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">Nome:</span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">CNPJ:</span>{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CNPJ: A PREENCHER APÓS ABERTURA]
                  </span>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Endereço:
                  </span>{' '}
                  Rua Gaspar Magalhães, 415, Apto 302, Rio de Janeiro, RJ,
                  Brasil —{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CEP: A PREENCHER]
                  </span>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Serviço:
                  </span>{' '}
                  CanaryGate — plataforma SaaS de gerenciamento de feature flags
                  (canarygate.io)
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              2. Encarregado de Proteção de Dados (DPO)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Nos termos do art. 41 da LGPD, o Encarregado pelo tratamento de
                dados pessoais é:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">Nome:</span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
              </ul>
              <p>
                O Encarregado é o canal de comunicação entre o CanaryGate, os
                titulares dos dados e a Agência Nacional de Proteção de Dados
                (ANPD).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              3. Dados Pessoais que Coletamos
            </h2>
            <div className="text-cg-neutral-300 space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.1 Dados de identificação e cadastro
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Nome completo (quando fornecido voluntariamente);</li>
                  <li>Endereço de e-mail;</li>
                  <li>
                    Dados de autenticação — senhas armazenadas em formato hash
                    (nunca em texto claro).
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.2 Dados de pagamento
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Nome e endereço de cobrança;</li>
                  <li>
                    Dados de cartão de crédito — processados diretamente pelo
                    processador de pagamentos; <em>não armazenamos</em> dados de
                    cartão em nossos servidores;
                  </li>
                  <li>Histórico de transações e status de assinatura.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.3 Dados de uso do Serviço
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Feature flags criadas, configuradas e modificadas;</li>
                  <li>Logs de auditoria (quem realizou cada ação e quando);</li>
                  <li>
                    Logs de acesso à API (chaves utilizadas, ambientes,
                    timestamps);
                  </li>
                  <li>Configurações de organizações e projetos.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.4 Dados técnicos
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>Endereço IP;</li>
                  <li>User agent (navegador e sistema operacional);</li>
                  <li>
                    Cookies de sessão necessários para autenticação (ver Seção
                    10);
                  </li>
                  <li>
                    Logs de aplicação para monitoramento de performance e erros.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  3.5 Dados de comunicação
                </h3>
                <ul className="list-inside list-disc space-y-1 pl-2">
                  <li>
                    E-mails trocados com nossa equipe (suporte, convites de
                    membros, notificações da conta).
                  </li>
                </ul>
              </div>
              <p className="text-cg-neutral-500 italic">
                Não coletamos dados pessoais sensíveis conforme definidos no
                art. 5, II da LGPD (saúde, biometria, origem étnica, crenças
                religiosas, dados genéticos, etc.).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              4. Finalidades e Bases Legais (LGPD)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Tratamos dados pessoais somente quando há uma base legal
                adequada, nos termos do art. 7 da LGPD:
              </p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 w-3/5 px-4 py-3 font-semibold">
                        Finalidade
                      </th>
                      <th className="text-cg-neutral-200 w-2/5 px-4 py-3 font-semibold">
                        Base Legal (LGPD art. 7)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Prestação do Serviço (autenticação, flags, ambientes)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Execução de contrato (inciso V)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Processamento de pagamentos e faturamento
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Execução de contrato (inciso V) + Obrigação legal
                        (inciso II)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Emissão de nota fiscal de serviço (NFS-e)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Obrigação legal (inciso II)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Comunicações transacionais (alertas, confirmações,
                        convites)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Execução de contrato (inciso V)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Marketing e newsletters (opt-in)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Consentimento (inciso I) — revogável a qualquer momento
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Segurança, prevenção a fraude e abuso
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Legítimo interesse (inciso IX)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Melhoria do Serviço (análise de uso agregada e
                        anonimizada)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Legítimo interesse (inciso IX)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Defesa em processos judiciais ou administrativos
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Exercício regular de direitos (inciso VI)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              5. Compartilhamento de Dados
            </h2>
            <div className="text-cg-neutral-300 space-y-4 text-sm leading-relaxed">
              <p className="text-cg-neutral-200 font-medium">
                Não vendemos, alugamos nem comercializamos dados pessoais de
                Usuários.
              </p>
              <p>
                Podemos compartilhar dados com os seguintes operadores, que
                estão contratualmente obrigados a tratá-los apenas conforme
                nossas instruções e em conformidade com a LGPD:
              </p>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.1 Operadores de dados (processadores)
                </h3>
                <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                  <li>
                    <span className="text-cg-neutral-200">
                      Processador de pagamentos
                    </span>{' '}
                    (ex.: Stripe, Asaas ou similar): processamento de cobranças,
                    assinaturas e reembolsos;
                  </li>
                  <li>
                    <span className="text-cg-neutral-200">
                      Provedor de e-mail transacional
                    </span>{' '}
                    (Resend): envio de notificações, convites e comunicações da
                    conta;
                  </li>
                  <li>
                    <span className="text-cg-neutral-200">
                      Provedores de infraestrutura em nuvem
                    </span>{' '}
                    (ex.: Railway, Neon, Upstash ou similares): hospedagem,
                    banco de dados e cache.
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.2 Autoridades competentes
                </h3>
                <p>
                  Podemos divulgar dados pessoais quando legalmente obrigados
                  por decisão judicial, autoridade administrativa ou regulatória
                  competente, incluindo a ANPD.
                </p>
              </div>
              <div>
                <h3 className="text-cg-neutral-200 mb-2 font-medium">
                  5.3 Transferência de controle
                </h3>
                <p>
                  Em caso de fusão, aquisição ou venda de ativos, os dados
                  pessoais poderão ser transferidos ao adquirente, que estará
                  vinculado a esta Política ou a uma equivalente, com
                  comunicação prévia aos titulares afetados.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              6. Transferência Internacional de Dados
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Nossos provedores de infraestrutura podem armazenar e processar
                dados em servidores localizados fora do Brasil, incluindo nos
                Estados Unidos e na União Europeia.
              </p>
              <p>
                Tais transferências são realizadas em conformidade com o art. 33
                da LGPD, mediante cláusulas contratuais com os operadores ou
                para países que proporcionem grau de proteção de dados
                equivalente ao exigido pela legislação brasileira.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              7. Retenção e Exclusão de Dados
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Mantemos dados pessoais pelo tempo necessário às finalidades
                para as quais foram coletados, observando os prazos legais:
              </p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 w-3/5 px-4 py-3 font-semibold">
                        Categoria de Dados
                      </th>
                      <th className="text-cg-neutral-200 w-2/5 px-4 py-3 font-semibold">
                        Prazo de Retenção
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Dados de conta ativa
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Enquanto a conta estiver ativa
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Dados após cancelamento da conta
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        90 dias para download; após isso, excluídos dos
                        servidores ativos
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Registros fiscais e financeiros
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        5 anos (obrigação legal)
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Logs de auditoria do Serviço
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">2 anos</td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Dados de marketing (com consentimento)
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Até revogação do consentimento
                      </td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Dados de suporte e comunicações
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">3 anos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Após o vencimento dos prazos acima, os dados são eliminados ou
                anonimizados de forma irreversível.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              8. Direitos dos Titulares (LGPD, art. 18)
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Você, como titular dos dados, tem os seguintes direitos em
                relação ao tratamento realizado pelo CanaryGate:
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-200">Confirmação:</span>{' '}
                  confirmar se tratamos dados seus;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Acesso:</span> obter
                  cópia dos seus dados pessoais tratados;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Correção:</span>{' '}
                  solicitar a correção de dados incompletos, inexatos ou
                  desatualizados;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Anonimização, bloqueio ou eliminação:
                  </span>{' '}
                  de dados desnecessários, excessivos ou tratados em
                  desconformidade com a LGPD;
                </li>
                <li>
                  <span className="text-cg-neutral-200">Portabilidade:</span>{' '}
                  receber seus dados em formato estruturado e interoperável;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Eliminação por consentimento:
                  </span>{' '}
                  solicitar a exclusão dos dados cujo tratamento se baseia em
                  consentimento;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Informação sobre compartilhamento:
                  </span>{' '}
                  saber com quais entidades compartilhamos seus dados;
                </li>
                <li>
                  <span className="text-cg-neutral-200">
                    Revogação do consentimento:
                  </span>{' '}
                  retirar consentimento a qualquer momento, sem prejuízo dos
                  tratamentos já realizados; e
                </li>
                <li>
                  <span className="text-cg-neutral-200">Oposição:</span> opor-se
                  a tratamentos realizados sem base legal adequada.
                </li>
              </ul>
              <div className="bg-cg-bg-100/40 border-cg-bg-100 mt-4 rounded-lg border p-4">
                <p className="text-cg-neutral-200 mb-1 font-medium">
                  Como exercer seus direitos:
                </p>
                <p>
                  Envie uma solicitação para{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>{' '}
                  com o assunto{' '}
                  <span className="text-cg-neutral-200">
                    &ldquo;Direitos LGPD — [seu nome]&rdquo;
                  </span>
                  . Responderemos no prazo de até 15 (quinze) dias corridos,
                  conforme o art. 19, II da LGPD.
                </p>
                <p className="mt-2">
                  Você também pode apresentar reclamação diretamente à ANPD em{' '}
                  <a
                    href="https://www.gov.br/anpd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    www.gov.br/anpd
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              9. Segurança dos Dados
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Adotamos medidas técnicas e organizacionais para proteger os
                dados pessoais contra acesso não autorizado, destruição, perda,
                alteração ou divulgação indevida:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>Transmissão de dados criptografada via TLS (HTTPS);</li>
                <li>
                  Senhas armazenadas em hash com algoritmo seguro — nunca em
                  texto claro;
                </li>
                <li>
                  Acesso aos dados pessoais restrito às pessoas que precisam
                  para desempenhar suas funções;
                </li>
                <li>Monitoramento de segurança e logs de acesso; e</li>
                <li>Isolamento de ambientes de produção.</li>
              </ul>
              <p>
                Em caso de incidente de segurança que possa acarretar risco ou
                dano relevante aos titulares, comunicaremos o ocorrido à ANPD e
                aos titulares afetados em prazo razoável, conforme o art. 48 da
                LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              10. Cookies e Tecnologias Similares
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>Utilizamos os seguintes tipos de cookies:</p>
              <div className="border-cg-bg-100 overflow-x-auto rounded-lg border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-cg-bg-100 bg-cg-bg-100/50 border-b">
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Tipo
                      </th>
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Finalidade
                      </th>
                      <th className="text-cg-neutral-200 px-4 py-3 font-semibold">
                        Obrigatório
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-cg-bg-100 divide-y">
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Sessão / autenticação
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Manter o Usuário autenticado durante a navegação
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">Sim</td>
                    </tr>
                    <tr>
                      <td className="text-cg-neutral-300 px-4 py-3">
                        Preferências
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">
                        Armazenar configurações de interface
                      </td>
                      <td className="text-cg-neutral-400 px-4 py-3">Não</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Não utilizamos cookies de rastreamento para fins publicitários.
                A desativação de cookies de sessão nas configurações do seu
                navegador impedirá o acesso a funcionalidades autenticadas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              11. Menores de Idade
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                O Serviço não se destina a crianças. Nos termos do art. 14 da
                LGPD, não coletamos intencionalmente dados pessoais de crianças
                (menores de 12 anos) nem de adolescentes (menores de 18 anos)
                sem o consentimento específico e destacado de pelo menos um dos
                pais ou do responsável legal.
              </p>
              <p>
                Se tomarmos conhecimento de que dados de menores foram coletados
                sem o consentimento adequado, os excluiremos imediatamente.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              12. Alterações desta Política
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Podemos atualizar esta Política periodicamente. Alterações
                relevantes serão comunicadas com pelo menos 30 (trinta) dias de
                antecedência, por e-mail ou notificação na plataforma.
              </p>
              <p>
                O uso continuado do Serviço após a entrada em vigor das
                alterações constitui aceitação da nova Política. Se você não
                concordar com as mudanças, deve cancelar a conta antes da data
                de vigência.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              13. Contato e Canal de Atendimento
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Para exercer seus direitos, tirar dúvidas ou apresentar
                reclamações sobre o tratamento de dados pessoais:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Encarregado (DPO):
                  </span>{' '}
                  Rafael Castilho e Borges
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    E-mail:
                  </span>{' '}
                  <a
                    href="mailto:rcborges98@gmail.com"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    rcborges98@gmail.com
                  </a>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Endereço:
                  </span>{' '}
                  Rua Gaspar Magalhães, 415, Apto 302, Rio de Janeiro, RJ,
                  Brasil —{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CEP: A PREENCHER]
                  </span>
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    Autoridade fiscalizadora (ANPD):
                  </span>{' '}
                  <a
                    href="https://www.gov.br/anpd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                  >
                    www.gov.br/anpd
                  </a>{' '}
                  | ouvidoria@anpd.gov.br
                </li>
              </ul>
            </div>
          </section>
        </div>

        <div className="border-cg-bg-100 mt-16 border-t pt-8">
          <p className="text-cg-neutral-600 text-xs">
            © {new Date().getFullYear()} CanaryGate. Esta Política foi redigida
            em conformidade com a Lei nº 13.709/2018 (LGPD) e o Marco Civil da
            Internet (Lei nº 12.965/2014).
          </p>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}
