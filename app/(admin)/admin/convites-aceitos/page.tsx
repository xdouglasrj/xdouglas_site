import type { Metadata } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AcceptedActions } from './accepted-actions'
import {
  cleanupExpiredInvites,
  inviteExpiryCutoff,
  INVITE_EXPIRY_DAYS,
} from '@/lib/invites/cleanup'
import {
  inviteTargetForCategory,
  buildRegistrationUrl,
} from '@/lib/invites/code'
import { getWaitlistStats } from '@/lib/admin/waitlist-stats'
import { WaitlistStatsBar } from '@/components/admin/waitlist-stats-bar'
import { AdminSearchBar } from '@/components/admin/admin-search-bar'
import { AdminPagination } from '@/components/admin/admin-pagination'
import { ADMIN_PAGE_SIZE, parsePage } from '@/lib/admin/pagination'

export const metadata: Metadata = { title: 'Convites pendentes' }
export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  DJ: 'DJ', PRODUTOR: 'Produtor', ARTISTA: 'Artista',
  MUSICO: 'Músico', OUVINTE: 'Ouvinte', OUTRO: 'Outro',
}

const TIPO_COLOR: Record<string, string> = {
  DJ:       'bg-violet-950/60 text-violet-400 border-violet-800/60',
  PRODUTOR: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
  ARTISTA:  'bg-rose-950/60 text-rose-400 border-rose-800/60',
  MUSICO:   'bg-sky-950/60 text-sky-400 border-sky-800/60',
  OUVINTE:  'bg-teal-950/60 text-teal-400 border-teal-800/60',
  OUTRO:    'bg-neutral-800 text-neutral-400 border-neutral-700',
}

function daysLeft(invitedAt: Date, now: Date): number {
  const elapsedDays = Math.floor((now.getTime() - invitedAt.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(0, INVITE_EXPIRY_DAYS - elapsedDays)
}

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminConvitesAceitosPage({ searchParams }: PageProps) {
  // Limpeza preguiçosa: ao abrir, remove os que já passaram de 7 dias
  await cleanupExpiredInvites()

  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = parsePage(pageParam)

  const now = new Date()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const where: Prisma.WaitlistWhereInput = {
    usedAt: null,
    invitedAt: { not: null, gte: inviteExpiryCutoff(now) },
    ...(query && {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ],
    }),
  }

  const [stats, count, entries] = await Promise.all([
    getWaitlistStats(),
    prisma.waitlist.count({ where }),
    prisma.waitlist.findMany({
      where,
      orderBy: { invitedAt: 'desc' },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true, email: true, name: true,
        tipoUsuario: true, inviteCode: true, invitedAt: true,
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE))

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Convites pendentes</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Convites aceitos aguardando o cadastro ser concluído · expiram sozinhos em {INVITE_EXPIRY_DAYS} dias
        </p>
      </div>

      <WaitlistStatsBar {...stats} />

      <AdminSearchBar defaultValue={query} placeholder="Buscar por nome, email ou telefone..." />

      {entries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">
            {query ? 'Nenhum convite encontrado.' : 'Nenhum convite aceito aguardando cadastro.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">Perfil</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">Chave</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden lg:table-cell">Expira em</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {entries.map((entry) => {
                const left = entry.invitedAt ? daysLeft(entry.invitedAt, now) : 0
                const target = inviteTargetForCategory(entry.tipoUsuario)
                const url = entry.inviteCode
                  ? buildRegistrationUrl(baseUrl, target, entry.inviteCode)
                  : ''
                return (
                  <tr key={entry.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-200 truncate">
                        {entry.name || entry.email}
                      </p>
                      <p className="text-xs text-neutral-600 truncate">{entry.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={[
                        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        TIPO_COLOR[entry.tipoUsuario] ?? TIPO_COLOR.OUTRO,
                      ].join(' ')}>
                        {TIPO_LABEL[entry.tipoUsuario] ?? entry.tipoUsuario}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-mono text-xs text-neutral-400">{entry.inviteCode ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={[
                        'text-xs font-medium tabular-nums',
                        left <= 1 ? 'text-red-400' : left <= 3 ? 'text-amber-400' : 'text-neutral-400',
                      ].join(' ')}>
                        {left === 0 ? 'hoje' : `${left} dia${left !== 1 ? 's' : ''}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <AcceptedActions id={entry.id} email={entry.email} registrationUrl={url} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination page={page} totalPages={totalPages} basePath="/admin/convites-aceitos" query={query} />
    </div>
  )
}
