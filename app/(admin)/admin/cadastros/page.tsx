import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { UserActions } from './user-actions'

export const metadata: Metadata = { title: 'Cadastros' }
export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, string> = {
  ARTIST: 'Músico/Produtor',
  GUEST: 'Visitante',
}

const ROLE_COLOR: Record<string, string> = {
  ARTIST: 'bg-rose-950/60 text-rose-400 border-rose-800/60',
  GUEST: 'bg-sky-950/60 text-sky-400 border-sky-800/60',
}

export default async function AdminCadastrosPage() {
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      artisticName: true,
      role: true,
      active: true,
      blocked: true,
      phone: true,
      inviteCode: true,
      newsletterOptIn: true,
      createdAt: true,
    },
  })

  const pending = users.filter((u) => !u.active).length

  return (
    <div className="max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Cadastros</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          {users.length} cadastro{users.length !== 1 ? 's' : ''} · {pending} aguardando aprovação
        </p>
      </div>

      {users.length === 0 ? (
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
                  Usuário
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden sm:table-cell">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden md:table-cell">
                  Código de convite
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide hidden lg:table-cell">
                  Cadastro em
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors">
                  {/* Usuário */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-200 truncate">
                      {user.artisticName || user.name || user.username}
                    </p>
                    <p className="text-xs text-neutral-600 truncate">{user.email}</p>
                    {user.phone && (
                      <p className="text-xs text-neutral-600 truncate">{user.phone}</p>
                    )}
                  </td>

                  {/* Tipo */}
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                      ROLE_COLOR[user.role] ?? ROLE_COLOR.GUEST,
                    ].join(' ')}>
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>

                  {/* Código de convite */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-neutral-500 font-mono truncate">
                      {user.inviteCode || '—'}
                    </p>
                  </td>

                  {/* Data */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-xs text-neutral-500 tabular-nums">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    {user.blocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-950/60 text-red-400 border border-red-800/60">
                        <span className="w-1 h-1 rounded-full bg-red-400" aria-hidden="true" />
                        Bloqueado
                      </span>
                    ) : user.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                        <span className="w-1 h-1 rounded-full bg-emerald-400" aria-hidden="true" />
                        Aprovado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-500 border border-neutral-700">
                        <span className="w-1 h-1 rounded-full bg-neutral-500" aria-hidden="true" />
                        Pendente
                      </span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <UserActions id={user.id} username={user.username} active={user.active} blocked={user.blocked} />
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
