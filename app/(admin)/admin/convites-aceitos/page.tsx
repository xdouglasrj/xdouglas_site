import type { Metadata } from 'next'
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

export const metadata: Metadata = { title: 'Convites aceitos' }
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

export default async function AdminConvitesAceitosPage() {
  // Limpeza preguiçosa: ao abrir, remove os que já passaram de 7 dias
  await cleanupExpiredInvites()

  const now = new Date()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const entries = await prisma.waitlist.findMany({
    where: { usedAt: null, invitedAt: { not: null, gte: inviteExpiryCutoff(now) } },
    orderBy: { invitedAt: 'desc' },
    select: {
      id: true, email: true, name: true, artisticName: true,
      tipoUsuario: true, inviteCode: true, invitedAt: true,
    },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Convites aceitos</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {entries.length} convite{entries.length !== 1 ? 's' : ''} aguardando o cadastro ser concluído ·
          expiram sozinhos em {INVITE_EXPIRY_DAYS} dias
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">
            Nenhum convite aceito aguardando cadastro.
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
                        {entry.artisticName || entry.name || entry.email}
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
    </div>
  )
}
