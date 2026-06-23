import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { WaitlistActions } from './waitlist-actions'

export const metadata: Metadata = { title: 'Convites pendentes' }
export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  DJ: 'DJ',
  PRODUTOR: 'Produtor',
  ARTISTA: 'Artista',
  MUSICO: 'Músico',
  OUVINTE: 'Ouvinte',
  OUTRO: 'Outro',
}

const TIPO_COLOR: Record<string, string> = {
  DJ:       'bg-violet-950/60 text-violet-400 border-violet-800/60',
  PRODUTOR: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  ARTISTA:  'bg-rose-950/60 text-rose-400 border-rose-800/60',
  MUSICO:   'bg-sky-950/60 text-sky-400 border-sky-800/60',
  OUVINTE:  'bg-teal-950/60 text-teal-400 border-teal-800/60',
  OUTRO:    'bg-neutral-800 text-neutral-400 border-neutral-700',
}

export default async function AdminConvitesPage() {
  const entries = await prisma.waitlist.findMany({
    where: { invitedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      artisticName: true,
      phone: true,
      tipoUsuario: true,
      message: true,
      createdAt: true,
    },
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Convites pendentes</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {entries.length} pedido{entries.length !== 1 ? 's' : ''} aguardando avaliação
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">
            Nenhum pedido de convite pendente.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Contato
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">
                  Perfil
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Mensagem
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden lg:table-cell">
                  Pedido em
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-neutral-800/40 transition-colors">
                  {/* Contato */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-200 truncate">
                      {entry.artisticName || entry.name || entry.email}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">{entry.email}</p>
                    {entry.phone && (
                      <p className="text-xs text-neutral-600 truncate">{entry.phone}</p>
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

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <WaitlistActions id={entry.id} email={entry.email} />
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
