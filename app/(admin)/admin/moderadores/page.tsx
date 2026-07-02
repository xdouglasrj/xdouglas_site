import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PERMISSION_GROUPS } from '@/lib/permissions/catalog'

export const metadata: Metadata = { title: 'Moderadores' }
export const dynamic = 'force-dynamic'

const PERMISSION_LABEL = new Map<string, string>(
  PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => [i.id as string, i.label]))
)

export default async function AdminModeradoresPage() {
  const moderators = await prisma.user.findMany({
    where: { role: 'MODERATOR' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      artisticName: true,
      permissions: true,
      active: true,
      blocked: true,
    },
  })

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Moderadores</h1>
        <p className="text-sm text-neutral-500 mt-1 max-w-xl">
          Usuários com papel MODERATOR e as permissões atribuídas a cada um.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="text-sm font-medium text-neutral-200 mb-2">Promover usuário a moderador</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Busque o usuário e atribua a primeira permissão na tela de permissões — ele é promovido
          a MODERATOR automaticamente ao salvar.
        </p>
        <form method="GET" action="/admin/configuracoes/permissoes" className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="Nome de usuário, nome artístico ou email..."
            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
          />
          <button
            type="submit"
            className="rounded-lg bg-gate-pink px-4 py-2 text-xs font-semibold text-white transition hover:bg-gate-pink/90"
          >
            Buscar
          </button>
        </form>
      </div>

      {moderators.length === 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Nenhum moderador cadastrado ainda.</p>
        </div>
      )}

      <div className="space-y-3">
        {moderators.map((mod) => {
          const displayName = mod.name || mod.artisticName || mod.username || mod.email
          return (
            <div key={mod.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                <div>
                  <p className="font-medium text-neutral-200">
                    {displayName}
                    {mod.username && <span className="ml-2 text-xs font-mono text-rose-400/80">@{mod.username}</span>}
                  </p>
                  <p className="text-xs text-neutral-600">{mod.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {mod.blocked && (
                    <span className="rounded-full border border-red-800 bg-red-950 px-2 py-0.5 text-[10px] text-red-400">
                      Bloqueado
                    </span>
                  )}
                  <Link
                    href={`/admin/configuracoes/permissoes?q=${encodeURIComponent(mod.username || mod.email)}`}
                    className="rounded-lg border border-neutral-700 px-3 py-1 text-xs font-medium text-neutral-300 transition hover:border-gate-pink hover:text-gate-pink"
                  >
                    Editar permissões
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {mod.permissions.length === 0 ? (
                  <span className="text-[11px] text-neutral-600">Nenhuma permissão atribuída</span>
                ) : (
                  mod.permissions.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] text-neutral-300"
                    >
                      {PERMISSION_LABEL.get(p) ?? p}
                    </span>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
