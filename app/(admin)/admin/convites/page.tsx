import type { Metadata } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { WaitlistActions } from './waitlist-actions'
import { AutoAcceptCard } from './auto-accept-card'
import { getAutoAcceptSettings } from '@/lib/settings/auto-accept'
import { getWaitlistStats } from '@/lib/admin/waitlist-stats'
import { WaitlistStatsBar } from '@/components/admin/waitlist-stats-bar'
import { AdminSearchBar } from '@/components/admin/admin-search-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { ADMIN_PAGE_SIZE, parsePage } from '@/lib/admin/pagination'

export const metadata: Metadata = { title: 'Pedidos recebidos' }
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

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminConvitesPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = parsePage(pageParam)

  const where: Prisma.WaitlistWhereInput = {
    invitedAt: null,
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ],
    }),
  }

  const [stats, autoAccept, count, entries] = await Promise.all([
    getWaitlistStats(),
    getAutoAcceptSettings(),
    prisma.waitlist.count({ where }),
    prisma.waitlist.findMany({
      where,
      // Prioritários (comprados na loja) sempre no topo da fila — o aceite
      // continua manual, isso só reordena pra você decidir quem priorizar
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        tipoUsuario: true,
        message: true,
        createdAt: true,
        priority: true,
        referredByUserId: true,
        referredByUser: { select: { email: true, name: true, handle: true } },
      },
    }),
  ])

  // Pra cada indicador presente nesta página, conta quantas indicações ele
  // já fez no total — sinal simples de abuso (muitos pedidos do mesmo
  // email indicando) sem precisar cruzar manualmente
  const referrerIds = [...new Set(entries.map((e) => e.referredByUserId).filter((id): id is string => !!id))]
  const referralCounts = referrerIds.length
    ? await prisma.waitlist.groupBy({
        by: ['referredByUserId'],
        where: { referredByUserId: { in: referrerIds } },
        _count: { _all: true },
      })
    : []
  const referralCountByUserId = new Map(referralCounts.map((r) => [r.referredByUserId, r._count._all]))

  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE))

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Pedidos recebidos</h1>
      </div>

      <WaitlistStatsBar {...stats} />

      <AutoAcceptCard
        initialEnabled={autoAccept.enabled}
        initialRemaining={autoAccept.remaining}
      />

      <AdminSearchBar defaultValue={query} placeholder="Buscar por nome, email ou telefone..." />

      {entries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">
            {query ? 'Nenhum pedido encontrado.' : 'Nenhum pedido de convite pendente.'}
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
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Indicado por
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
                    <div className="flex items-center gap-2">
                      {entry.priority && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
                          Prioritário
                        </span>
                      )}
                      <p className="font-medium text-neutral-200 truncate">
                        {entry.name || entry.email}
                      </p>
                    </div>
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

                  {/* Indicado por */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    {entry.referredByUser ? (
                      <div>
                        <p className="text-xs text-neutral-400 truncate max-w-[160px]">
                          {entry.referredByUser.email}
                        </p>
                        {(referralCountByUserId.get(entry.referredByUserId) ?? 0) > 1 && (
                          <p className="text-[10px] text-rose-500">
                            {referralCountByUserId.get(entry.referredByUserId)} indicações no total — verificar
                          </p>
                        )}
                      </div>
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
                    <WaitlistActions id={entry.id} email={entry.email} hasReferrer={!!entry.referredByUserId} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/convites" query={query} />
    </div>
  )
}
