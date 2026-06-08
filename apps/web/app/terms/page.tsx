import type { Metadata } from 'next'
import { LandingNav } from '@/components/home/nav'
import { LandingFooter } from '@/components/home/footer'

export const metadata: Metadata = {
  title: 'Termos de Uso — CanaryGate',
  description:
    'Termos e condições de uso da plataforma CanaryGate. Leia antes de criar sua conta.'
}

export default function TermsPage() {
  return (
    <main className="bg-background text-cg-neutral-100">
      <LandingNav />

      <div className="mx-auto max-w-3xl px-4 pt-32 pb-24 sm:px-8">
        <div className="border-cg-bg-100 mb-12 border-b pb-8">
          <h1 className="text-cg-neutral-100 text-3xl font-bold">
            Termos de Uso
          </h1>
          <p className="text-cg-neutral-500 mt-3 text-sm">
            Versão 1.0 &mdash; Data de vigência:{' '}
            <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
              [DATA: A PREENCHER]
            </span>
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              1. Aceitação dos Termos
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Ao criar uma conta, acessar ou utilizar o CanaryGate
                (&ldquo;Serviço&rdquo;), você (&ldquo;Usuário&rdquo;) declara
                ter lido, compreendido e concordado com estes Termos de Uso
                (&ldquo;Termos&rdquo;) e com a nossa{' '}
                <a
                  href="/privacy"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  Política de Privacidade
                </a>
                .
              </p>
              <p>
                Se você está aceitando estes Termos em nome de uma empresa ou
                outra entidade jurídica, você declara ter poderes para
                vinculá-la a estes Termos.
              </p>
              <p>
                Se você não concorda com qualquer disposição destes Termos, não
                crie uma conta nem utilize o Serviço.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              2. Definições
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Para fins destes Termos, os seguintes termos têm o significado
                abaixo:
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;CanaryGate&rdquo;, &ldquo;nós&rdquo; ou
                    &ldquo;nosso&rdquo;
                  </span>{' '}
                  refere-se a Rafael Castilho e Borges,{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CNPJ: A PREENCHER APÓS ABERTURA]
                  </span>
                  , com endereço em Rua Gaspar Magalhães, 415, Apto 302, Rio de
                  Janeiro, RJ, Brasil,{' '}
                  <span className="rounded border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 font-mono text-xs text-yellow-400">
                    [CEP: A PREENCHER]
                  </span>
                  .
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;Serviço&rdquo;
                  </span>{' '}
                  refere-se à plataforma SaaS de gerenciamento de feature flags
                  disponível em canarygate.io e suas subpáginas.
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;Usuário&rdquo; ou &ldquo;você&rdquo;
                  </span>{' '}
                  refere-se a qualquer pessoa física ou jurídica que acessa ou
                  utiliza o Serviço.
                </li>
                <li>
                  <span className="text-cg-neutral-100 font-medium">
                    &ldquo;Dados do Usuário&rdquo;
                  </span>{' '}
                  refere-se a todos os dados que o Usuário insere, cria ou
                  processa por meio do Serviço, incluindo feature flags,
                  configurações, chaves de API e logs de auditoria.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              3. Descrição do Serviço
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                O CanaryGate é uma plataforma de gerenciamento de feature flags
                que permite:
              </p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>Criar e gerenciar feature flags em múltiplos ambientes;</li>
                <li>
                  Realizar rollout gradual e controlado de funcionalidades;
                </li>
                <li>
                  Receber atualizações em tempo real via SSE (Server-Sent
                  Events);
                </li>
                <li>Auditar alterações com registro de autor e timestamp; e</li>
                <li>
                  Integrar o controle de flags às suas aplicações por meio de
                  SDK e API REST documentada.
                </li>
              </ul>
              <p>
                O Serviço é oferecido no modelo Software as a Service (SaaS),
                acessível mediante assinatura ou plano gratuito. A
                funcionalidade exata de cada plano é descrita na{' '}
                <a
                  href="/#pricing"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  página de preços
                </a>
                .
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              4. Cadastro e Conta
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                4.1. Para utilizar o Serviço, o Usuário deve criar uma conta
                fornecendo um endereço de e-mail válido.
              </p>
              <p>
                4.2. O Usuário é o único responsável por manter a
                confidencialidade de suas credenciais de acesso. O CanaryGate
                não se responsabiliza por perdas ou danos decorrentes de uso não
                autorizado da conta atribuível à falha do Usuário em proteger
                suas credenciais.
              </p>
              <p>
                4.3. O Usuário deve notificar imediatamente o CanaryGate, pelo
                e-mail{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                , em caso de uso não autorizado de sua conta ou qualquer
                suspeita de violação de segurança.
              </p>
              <p>
                4.4. Cada conta é pessoal e intransferível, exceto no contexto
                de organizações, onde membros adicionais podem ser convidados
                conforme as funcionalidades da plataforma.
              </p>
              <p>
                4.5. O Usuário concorda em fornecer informações verdadeiras,
                precisas, atuais e completas durante o cadastro e a manter essas
                informações atualizadas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              5. Planos, Preços e Pagamentos
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                5.1. O CanaryGate oferece um plano gratuito com funcionalidades
                limitadas e planos pagos com funcionalidades adicionais. Os
                valores e as funcionalidades de cada plano estão disponíveis em{' '}
                <a
                  href="/#pricing"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  canarygate.io/#pricing
                </a>
                .
              </p>
              <p>
                5.2. Assinaturas pagas são cobradas de forma recorrente (mensal
                ou anual, conforme selecionado no momento da contratação) e
                renovadas automaticamente ao final de cada período, salvo
                cancelamento pelo Usuário.
              </p>
              <p>
                5.3. O Usuário pode cancelar a renovação automática a qualquer
                momento nas configurações da conta. O cancelamento é eficaz ao
                final do período já pago.
              </p>
              <p>
                5.4. Os preços são informados em reais (BRL) ou dólares
                americanos (USD) conforme indicado na página de preços. Usuários
                internacionais estão sujeitos a taxas de câmbio e encargos
                aplicados pela sua instituição financeira.
              </p>
              <p>
                5.5. Em caso de falha no pagamento após as tentativas
                automáticas de cobrança, o CanaryGate notificará o Usuário e
                poderá suspender ou reclassificar a conta para o plano gratuito.
              </p>
              <p>
                5.6. O CanaryGate reserva-se o direito de alterar os preços dos
                planos com aviso prévio de pelo menos 30 (trinta) dias, conforme
                descrito na Seção 14.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              6. Direito de Arrependimento e Cancelamento
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                <span className="text-cg-neutral-100 font-medium">
                  6.1. Direito de arrependimento (CDC, art. 49):
                </span>{' '}
                O Usuário que contratar um plano pago poderá desistir da
                contratação no prazo de 7 (sete) dias corridos, contados da data
                da primeira cobrança, nos termos do art. 49 do Código de Defesa
                do Consumidor (Lei nº 8.078/1990). Para exercer esse direito, o
                Usuário deve enviar comunicação escrita para{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>{' '}
                com o assunto &ldquo;Arrependimento de Contratação&rdquo;. O
                valor pago será reembolsado integralmente em até 10 (dez) dias
                úteis.
              </p>
              <p>
                <span className="text-cg-neutral-100 font-medium">
                  6.2. Cancelamento após o prazo de arrependimento:
                </span>{' '}
                Após os 7 dias, não haverá reembolso de valores referentes ao
                período vigente já pago. O cancelamento interrompe a renovação
                automática, e o Usuário mantém acesso ao plano até o fim do
                período pago.
              </p>
              <p>
                6.3. O cancelamento pode ser realizado a qualquer momento nas
                configurações da conta ou por e-mail para{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                .
              </p>
              <p>
                6.4. Após o encerramento da conta, os Dados do Usuário serão
                mantidos por 90 (noventa) dias, período durante o qual o Usuário
                poderá exportá-los. Após esse prazo, os dados poderão ser
                excluídos de nossos servidores ativos, ressalvadas as obrigações
                de retenção previstas em lei.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              7. Uso Aceitável
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                7.1. O Usuário concorda em utilizar o Serviço apenas para fins
                lícitos e de acordo com estes Termos, as leis aplicáveis e as
                boas práticas de uso de serviços de internet.
              </p>
              <p>
                7.2.{' '}
                <span className="text-cg-neutral-100 font-medium">
                  É expressamente proibido:
                </span>
              </p>
              <ul className="border-cg-bg-100 space-y-2 border-l pl-4">
                <li>
                  a) Usar o Serviço para qualquer finalidade ilegal ou não
                  autorizada;
                </li>
                <li>
                  b) Realizar engenharia reversa, descompilar, desmontar ou
                  tentar extrair o código-fonte do Serviço;
                </li>
                <li>
                  c) Reproduzir, duplicar, copiar, vender, revender ou explorar
                  qualquer parte do Serviço sem permissão expressa e por escrito
                  do CanaryGate;
                </li>
                <li>
                  d) Usar o Serviço para desenvolver produtos ou serviços
                  concorrentes;
                </li>
                <li>
                  e) Realizar ataques de força bruta, tentativas de acesso não
                  autorizado, injeção de código ou qualquer outra ação que
                  comprometa a segurança ou a integridade do Serviço;
                </li>
                <li>
                  f) Usar scripts automatizados ou bots para consumir o Serviço
                  além do uso ordinário previsto na documentação da API;
                </li>
                <li>
                  g) Transmitir vírus, malware ou qualquer código malicioso;
                </li>
                <li>
                  h) Coletar ou armazenar dados pessoais de outros usuários sem
                  a devida base legal.
                </li>
              </ul>
              <p>
                7.3. O CanaryGate reserva o direito de investigar e tomar
                medidas cabíveis diante de violações desta seção, incluindo a
                suspensão ou encerramento imediato da conta.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              8. Propriedade Intelectual
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                8.1. O Serviço, incluindo seu software, interface, logotipos,
                marcas, documentação e todos os materiais a ele associados, é de
                propriedade exclusiva de Rafael Castilho e Borges e está
                protegido pelas leis brasileiras e internacionais de propriedade
                intelectual.
              </p>
              <p>
                8.2. Estes Termos concedem ao Usuário uma licença limitada, não
                exclusiva, intransferível e revogável para utilizar o Serviço
                exclusivamente nos termos aqui estabelecidos. O Usuário não
                adquire nenhum direito de propriedade sobre o Serviço ao
                utilizá-lo.
              </p>
              <p>
                8.3. A marca &ldquo;CanaryGate&rdquo; e seu logotipo são marcas
                de titularidade de Rafael Castilho e Borges. O uso não
                autorizado é vedado.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              9. Conteúdo e Dados do Usuário
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                9.1. O Usuário retém a titularidade de todos os Dados do Usuário
                inseridos ou gerados por meio do Serviço.
              </p>
              <p>
                9.2. Ao utilizar o Serviço, o Usuário concede ao CanaryGate uma
                licença limitada, não exclusiva e gratuita para armazenar,
                processar e transmitir os Dados do Usuário exclusivamente para a
                prestação do Serviço.
              </p>
              <p>
                9.3. O CanaryGate não utilizará os Dados do Usuário para nenhuma
                finalidade comercial além da prestação do Serviço, salvo
                consentimento expresso.
              </p>
              <p>
                9.4. O Usuário declara que possui todos os direitos necessários
                sobre os dados que insere no Serviço e que esses dados não
                violam direitos de terceiros nem legislação aplicável.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              10. Privacidade
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                O tratamento de dados pessoais pelo CanaryGate é regido pela
                nossa{' '}
                <a
                  href="/privacy"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  Política de Privacidade
                </a>
                , incorporada a estes Termos por referência. Ao utilizar o
                Serviço, o Usuário concorda com as práticas de tratamento de
                dados pessoais ali descritas.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              11. Disponibilidade do Serviço
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                11.1. O CanaryGate envidará esforços razoáveis para manter o
                Serviço disponível. No entanto, não garantimos disponibilidade
                ininterrupta ou isenta de erros.
              </p>
              <p>
                11.2. O Serviço pode ser temporariamente interrompido para
                manutenção, atualizações ou por circunstâncias fora do nosso
                controle razoável. Quando possível, manutenções programadas
                serão comunicadas com antecedência por e-mail ou notificação na
                plataforma.
              </p>
              <p>
                11.3. Não nos responsabilizamos por danos decorrentes de
                indisponibilidade do Serviço, exceto nos limites previstos pela
                legislação brasileira aplicável.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              12. Limitação de Responsabilidade
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                12.1. O Serviço é fornecido &ldquo;como está&rdquo; e
                &ldquo;conforme disponível&rdquo;, sem garantias de qualquer
                tipo, expressas ou implícitas, incluindo garantias de
                comerciabilidade, adequação a um propósito específico ou não
                violação de direitos.
              </p>
              <p>12.2. O CanaryGate não se responsabiliza por:</p>
              <ul className="list-inside list-disc space-y-1.5 pl-2">
                <li>
                  danos indiretos, incidentais, especiais, punitivos ou
                  consequentes;
                </li>
                <li>
                  perda de dados, lucros cessantes ou interrupção de negócios;
                </li>
                <li>
                  falhas em serviços de infraestrutura de terceiros (provedores
                  de nuvem, redes, etc.); ou
                </li>
                <li>uso indevido do Serviço pelo próprio Usuário.</li>
              </ul>
              <p>
                12.3. Em qualquer caso, a responsabilidade máxima do CanaryGate
                perante o Usuário, por qualquer causa, ficará limitada ao valor
                total pago pelo Usuário nos 12 (doze) meses anteriores ao evento
                que originou a responsabilidade, ou R$&nbsp;100,00 (cem reais),
                o que for maior.
              </p>
              <p>
                12.4. Nada nesta seção exclui ou limita responsabilidades que
                não possam ser afastadas pela legislação brasileira aplicável,
                incluindo o Código de Defesa do Consumidor e a LGPD.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              13. Indenização
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                O Usuário concorda em indenizar, defender e isentar o CanaryGate
                e seus representantes de quaisquer reivindicações, danos,
                perdas, responsabilidades, custos e despesas (incluindo
                honorários advocatícios razoáveis) decorrentes de: (a) uso do
                Serviço em violação a estes Termos; (b) violação de direitos de
                terceiros por meio do Serviço; ou (c) Dados do Usuário que
                infrinjam direitos de propriedade intelectual ou outras leis
                aplicáveis.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              14. Modificações no Serviço e nos Termos
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                14.1. O CanaryGate reserva o direito de modificar ou
                descontinuar, temporária ou permanentemente, o Serviço ou
                qualquer funcionalidade, com aviso prévio razoável sempre que
                possível.
              </p>
              <p>
                14.2. Podemos atualizar estes Termos periodicamente. Alterações
                substanciais (incluindo mudanças de preço, limitações de uso e
                direitos do Usuário) serão comunicadas com pelo menos 30
                (trinta) dias de antecedência, por e-mail e/ou notificação na
                plataforma.
              </p>
              <p>
                14.3. O uso continuado do Serviço após o prazo de aviso
                constitui aceitação dos novos Termos. Se o Usuário não concordar
                com as alterações, deve cancelar a conta antes da data de
                entrada em vigor das mudanças.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              15. Rescisão
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                15.1. O Usuário pode cancelar sua conta a qualquer momento nas
                configurações da conta ou pelo e-mail{' '}
                <a
                  href="mailto:rcborges98@gmail.com"
                  className="text-cg-indigo-300 hover:text-cg-indigo-200 underline underline-offset-2 transition-colors"
                >
                  rcborges98@gmail.com
                </a>
                .
              </p>
              <p>
                15.2. O CanaryGate pode suspender ou encerrar a conta do
                Usuário, imediatamente e sem aviso prévio, em caso de violação
                material destes Termos, incluindo violações de uso aceitável,
                fraude ou qualquer ato que prejudique o Serviço ou outros
                usuários.
              </p>
              <p>
                15.3. Após o encerramento da conta por qualquer motivo,
                sobreviverão as disposições que, por sua natureza, devem
                permanecer em vigor, incluindo as seções de propriedade
                intelectual, limitação de responsabilidade, indenização, lei
                aplicável e foro.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              16. Lei Aplicável e Foro de Eleição
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                16.1. Estes Termos são regidos pelas leis da República
                Federativa do Brasil, incluindo o Código de Defesa do Consumidor
                (Lei nº 8.078/1990), o Marco Civil da Internet (Lei nº
                12.965/2014) e a Lei Geral de Proteção de Dados Pessoais (Lei nº
                13.709/2018 — LGPD).
              </p>
              <p>
                16.2. Fica eleito o foro da Comarca do Rio de Janeiro, Estado do
                Rio de Janeiro, para dirimir quaisquer controvérsias oriundas
                destes Termos, com renúncia expressa a qualquer outro, por mais
                privilegiado que seja.
              </p>
              <p>
                16.3. Para Usuários localizados fora do Brasil, na medida em que
                leis locais imperativas conflitem com estes Termos, tais leis
                prevalecerão apenas na extensão do conflito.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              17. Disposições Gerais
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                17.1. Estes Termos, juntamente com a Política de Privacidade,
                constituem o acordo integral entre o Usuário e o CanaryGate em
                relação ao Serviço.
              </p>
              <p>
                17.2. A falha do CanaryGate em exercer ou fazer valer qualquer
                direito ou disposição destes Termos não constituirá renúncia a
                tal direito ou disposição.
              </p>
              <p>
                17.3. Caso qualquer disposição destes Termos seja declarada
                inválida ou inexequível por autoridade competente, as demais
                disposições permanecerão em pleno vigor e efeito.
              </p>
              <p>
                17.4. O Usuário não pode ceder ou transferir seus direitos ou
                obrigações decorrentes destes Termos sem o consentimento prévio
                e por escrito do CanaryGate.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-cg-neutral-100 mb-4 text-lg font-semibold">
              18. Contato
            </h2>
            <div className="text-cg-neutral-300 space-y-3 text-sm leading-relaxed">
              <p>
                Para dúvidas, solicitações ou comunicações formais em relação a
                estes Termos:
              </p>
              <ul className="border-cg-bg-100 space-y-1.5 border-l pl-4">
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
              </ul>
            </div>
          </section>
        </div>

        <div className="border-cg-bg-100 mt-16 border-t pt-8">
          <p className="text-cg-neutral-600 text-xs">
            © {new Date().getFullYear()} CanaryGate. Ao usar o Serviço, você
            confirma que leu e concordou com estes Termos.
          </p>
        </div>
      </div>

      <LandingFooter />
    </main>
  )
}
