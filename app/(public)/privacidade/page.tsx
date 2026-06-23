import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como a plataforma xDouglas coleta, usa e protege seus dados pessoais, em conformidade com a LGPD.',
}

// Data da última revisão — atualizar manualmente a cada mudança material
const LAST_UPDATED = '21 de junho de 2025'

export default function PrivacidadePage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Cabeçalho */}
      <div className="mb-10">
        <p className="text-xs text-neutral-600 uppercase tracking-wide mb-2">
          Documento legal
        </p>
        <h1 className="text-2xl font-bold text-white">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Última atualização: {LAST_UPDATED}
        </p>
      </div>

      <div className="prose-custom">

        <Section id="introducao" title="1. Introdução">
          <p>
            A plataforma <strong>xDouglas</strong> é uma comunidade privada para produtores, DJs e
            artistas. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
            protegemos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
            Pessoais (<strong>LGPD — Lei nº 13.709/2018</strong>).
          </p>
          <p>
            Ao utilizar a plataforma, você concorda com as práticas descritas neste documento. Se não
            concordar, recomendamos que não utilize os serviços.
          </p>
        </Section>

        <Section id="dados-coletados" title="2. Dados que coletamos">
          <Subsection title="2.1 Dados que você fornece diretamente">
            <ul>
              <li>
                <strong>Lista de espera:</strong> email, nome (opcional), tipo de perfil (DJ,
                Produtor, Artista ou Outro) e mensagem opcional. Coletados com seu consentimento
                explícito.
              </li>
              <li>
                <strong>Cadastro de conta</strong> (quando disponível): email e senha em hash
                irreversível — nunca armazenamos sua senha em texto puro.
              </li>
            </ul>
          </Subsection>

          <Subsection title="2.2 Dados coletados automaticamente">
            <ul>
              <li>
                <strong>Dados de navegação:</strong> páginas visitadas, tempo de visita,
                tipo de dispositivo (mobile, desktop ou tablet), navegador e sistema operacional.
              </li>
              <li>
                <strong>Dados de download:</strong> qual música foi baixada, país e cidade
                de origem (geolocalização aproximada por IP), data e hora.
              </li>
              <li>
                <strong>Endereço IP:</strong> coletado temporariamente apenas para fins de
                segurança e geolocalização. Armazenado exclusivamente como hash SHA-256 com salt
                rotativo mensal — <strong>não é possível recuperar o IP original</strong> a partir
                do hash. Os dados técnicos associados ao IP são excluídos automaticamente após
                90 dias.
              </li>
              <li>
                <strong>Identificador de sessão:</strong> um UUID anônimo gerado no seu
                navegador, válido apenas durante a sessão, sem associação à sua identidade.
              </li>
            </ul>
          </Subsection>

          <Subsection title="2.3 O que NÃO coletamos">
            <ul>
              <li>Seu IP em forma identificável em qualquer relatório ou painel</li>
              <li>Dados de localização GPS ou localização precisa</li>
              <li>Conteúdo de conversas privadas</li>
              <li>Dados de cartão de crédito (não realizamos cobranças nesta fase)</li>
              <li>Dados de menores de 18 anos — o serviço é exclusivo para adultos</li>
            </ul>
          </Subsection>
        </Section>

        <Section id="finalidade" title="3. Para que usamos seus dados">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left py-2 pr-4 text-neutral-400 font-medium">Dado</th>
                <th className="text-left py-2 text-neutral-400 font-medium">Finalidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {[
                ['Email (waitlist)', 'Enviar convite de acesso quando a plataforma abrir'],
                ['Tipo de perfil', 'Segmentar convites por tipo de usuário (DJ, Produtor…)'],
                ['Dados de navegação', 'Entender como a plataforma é usada e melhorá-la'],
                ['Dados de download', 'Fornecer métricas aos artistas sobre suas faixas'],
                ['IP hash', 'Detectar abusos e downloads suspeitos (segurança)'],
                ['Identificador de sessão', 'Contar visitantes únicos sem rastrear identidade'],
              ].map(([dado, finalidade]) => (
                <tr key={dado}>
                  <td className="py-2.5 pr-4 text-neutral-300 align-top font-medium whitespace-nowrap">
                    {dado}
                  </td>
                  <td className="py-2.5 text-neutral-500 align-top">{finalidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="base-legal" title="4. Base legal (LGPD)">
          <p>
            Tratamos seus dados com base nas seguintes hipóteses legais previstas na LGPD:
          </p>
          <ul>
            <li>
              <strong>Consentimento (Art. 7º, I):</strong> coleta de analytics e cookies — você
              decide ao interagir com o banner de consentimento. Pode revogar a qualquer momento.
            </li>
            <li>
              <strong>Legítimo interesse (Art. 7º, IX):</strong> segurança da plataforma, detecção
              de abusos e proteção contra fraudes.
            </li>
            <li>
              <strong>Execução de contrato (Art. 7º, V):</strong> dados necessários para entregar
              as funcionalidades que você solicitou (ex: download de uma música).
            </li>
          </ul>
        </Section>

        <Section id="compartilhamento" title="5. Compartilhamento de dados">
          <p>
            <strong>Não vendemos nem alugamos seus dados pessoais.</strong> Os dados podem ser
            compartilhados apenas nas seguintes situações:
          </p>
          <ul>
            <li>
              <strong>Provedores de infraestrutura:</strong> serviços de hospedagem (Vercel),
              banco de dados (PostgreSQL) e armazenamento de arquivos (Cloudflare R2). Esses
              fornecedores atuam como operadores de dados e estão sujeitos a acordos de
              confidencialidade.
            </li>
            <li>
              <strong>Obrigação legal:</strong> quando exigido por lei, ordem judicial ou
              autoridade competente.
            </li>
          </ul>
          <p>
            Métricas de analytics exibidas a artistas são sempre agregadas e anonimizadas —
            nenhum artista tem acesso a dados individuais de quem baixou suas músicas.
          </p>
        </Section>

        <Section id="retencao" title="6. Retenção e exclusão de dados">
          <ul>
            <li>
              <strong>Dados técnicos com IP hash</strong> (<code>analytics_raw_events</code>):
              excluídos automaticamente após <strong>90 dias</strong>.
            </li>
            <li>
              <strong>Dados de analytics anonimizados</strong> (<code>analytics_events</code>):
              retidos indefinidamente, pois não contêm dados pessoais identificáveis.
            </li>
            <li>
              <strong>Email da lista de espera:</strong> mantido até o envio do convite ou até você
              solicitar a remoção.
            </li>
            <li>
              <strong>Dados de conta:</strong> mantidos enquanto a conta estiver ativa. Excluídos
              mediante solicitação ou após 2 anos de inatividade.
            </li>
          </ul>
        </Section>

        <Section id="cookies" title="7. Cookies">
          <p>
            Utilizamos apenas cookies estritamente necessários ao funcionamento da plataforma:
          </p>
          <ul>
            <li>
              <strong>xd_access</strong> e <strong>xd_refresh</strong>: tokens de autenticação
              para administradores. Cookies HTTP-only, não acessíveis via JavaScript.
            </li>
            <li>
              <strong>xd_consent</strong> (localStorage): sua decisão sobre cookies de analytics.
              Não é um cookie propriamente dito — é armazenado localmente no seu navegador.
            </li>
            <li>
              <strong>xd_sid</strong> (sessionStorage): identificador de sessão anônimo,
              excluído ao fechar o navegador.
            </li>
          </ul>
          <p>
            <strong>Não utilizamos cookies de rastreamento, publicidade ou terceiros.</strong>
          </p>
        </Section>

        <Section id="seguranca" title="8. Segurança">
          <p>Adotamos as seguintes medidas técnicas de proteção:</p>
          <ul>
            <li>Comunicação criptografada via HTTPS/TLS em todo o tráfego</li>
            <li>Senhas armazenadas com hash bcrypt (custo 12)</li>
            <li>Tokens de autenticação armazenados apenas como hash SHA-256</li>
            <li>IPs armazenados apenas como hash irreversível com salt criptografado</li>
            <li>Arquivos de áudio entregues via URLs assinadas com validade de 15 minutos</li>
            <li>Rate limiting para prevenir abusos e ataques automatizados</li>
            <li>Logs de auditoria para todas as ações administrativas</li>
          </ul>
        </Section>

        <Section id="direitos" title="9. Seus direitos (LGPD)">
          <p>
            Como titular de dados pessoais, você tem os seguintes direitos garantidos pela LGPD:
          </p>
          <ul>
            <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
            <li><strong>Correção:</strong> solicitar a atualização de dados incompletos ou incorretos</li>
            <li><strong>Anonimização ou exclusão:</strong> de dados desnecessários ou coletados sem consentimento</li>
            <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
            <li><strong>Revogação do consentimento:</strong> a qualquer momento, sem prejuízo</li>
            <li><strong>Oposição:</strong> contestar o tratamento realizado com base em legítimo interesse</li>
            <li>
              <strong>Reclamação à ANPD:</strong> Autoridade Nacional de Proteção de Dados —{' '}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 underline hover:text-white transition-colors"
              >
                www.gov.br/anpd
              </a>
            </li>
          </ul>
          <p>
            Para exercer qualquer direito, entre em contato pelo email abaixo. Respondemos em até
            15 dias úteis.
          </p>
        </Section>

        <Section id="menores" title="10. Menores de idade">
          <p>
            A plataforma xDouglas é destinada exclusivamente a pessoas com 18 anos ou mais. Não
            coletamos intencionalmente dados de menores. Se identificarmos que dados de um menor
            foram fornecidos, excluiremos imediatamente.
          </p>
        </Section>

        <Section id="alteracoes" title="11. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. Alterações materiais serão comunicadas
            por email (quando aplicável) ou por aviso na plataforma. A data de última atualização
            no topo deste documento indica a versão em vigor.
          </p>
        </Section>

        <Section id="contato" title="12. Contato">
          <p>
            Para dúvidas, solicitações de direitos ou qualquer questão relacionada à privacidade:
          </p>
          <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm">
            <p className="text-neutral-300 font-medium">Encarregado de Dados (DPO)</p>
            <p className="text-neutral-500 mt-1">Plataforma xDouglas</p>
            <p className="text-neutral-500">
              Email:{' '}
              <a
                href="mailto:privacidade@xdouglas.com"
                className="text-neutral-300 hover:text-white transition-colors"
              >
                privacidade@xdouglas.com
              </a>
            </p>
          </div>
        </Section>

      </div>

      {/* Rodapé com link de volta */}
      <div className="mt-12 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-xs text-neutral-600">
          Versão em vigor desde {LAST_UPDATED}
        </p>
        <Link
          href="/"
          className="text-sm text-rose-500 hover:text-rose-400 transition-colors"
        >
          ← Voltar ao início
        </Link>
      </div>
    </main>
  )
}

// ── Sub-componentes ───────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-8 scroll-mt-6">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-neutral-400 leading-relaxed flex flex-col gap-3">
        {children}
      </div>
    </section>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-300 mb-2">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}
