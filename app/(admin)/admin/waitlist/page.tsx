import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Lista de espera' }
export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  DJ: 'DJ',
  PRODUTOR: 'Produtor',
  ARTISTA: 'Artista',
  OUTRO: 'Outro',
}

const TIPO_COLOR: Record<string, string> = {
  DJ:       'bg-violet-950/60 text-violet-400 border-violet-800/60',
  PRODUTOR: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  ARTISTA:  'bg-rose-950/60 text-rose-400 border-rose-800/60',
  OUTRO:    'bg-neutral-800 text-neutral-400 border-neutral-700',
}

export default async function AdminWaitlistPage() {
  const [entries, breakdown] = await Promise.all([
    prisma.waitlist.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        tipoUsuario: true,
        message: true,
        consentedAt: true,
        invitedAt: true,
        createdAt: true,
      },
    }),
    prisma.waitlist.groupBy({
      by: ['tipoUsuario'],
      _count: { _all: true },
    }),
  ])

  const total = entries.length
  const invited = entries.filter((e) => e.invitedAt).length
  const pending = total - invited

  // Mapa de contagem por tipo
  const countByTipo = Object.fromEntries(
    breakdown.map((b) => [b.tipoUsuario, b._count._all])
  )

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Lista de espera</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {total} cadastro{total !== 1 ? 's' : ''} · {pending} aguardando convite
        </p>
      </div>

      {/* Cards de breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {['DJ', 'PRODUTOR', 'ARTISTA', 'OUTRO'].map((tipo) => (
          <div
            key={tipo}
            className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              {TIPO_LABEL[tipo]}
            </p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {(countByTipo[tipo] ?? 0).toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">
            Nenhum cadastro ainda.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">
                  Perfil
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Mensagem
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden lg:table-cell">
                  Cadastro
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-800/40 transition-colors">
                  {/* Email + nome */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-200 truncate">
                      {entry.email}
                    </p>
                    {entry.name && (
                      <p className="text-xs text-neutral-600 truncate">{entry.name}</p>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      TIPO_COLOR[entry.tipoUsuario] ?? TIPO_COLOR.OUTRO,
                    ].join(' ')}>
                      {TIPO_LABEL[entry.tipoUsuario] ?? entry.tipoUsuario}
                    </span>
                  </td>

                  {/* Mensagem */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {entry.message ? (
                      <p className="text-xs text-neutral-500 truncate max-w-xs" title={entry.message}>
                        {entry.message}
                      </p>
                    ) : (
                      <span className="text-neutral-700">—</span>
                    )}
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-neutral-500 tabular-nums">
                      {new Date(entry.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {entry.invitedAt ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" aria-hidden="true" />
                        Convidado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-500 border border-neutral-700">
                        <span className="w-1 h-1 rounded-full bg-neutral-500" aria-hidden="true" />
                        Aguardando
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
