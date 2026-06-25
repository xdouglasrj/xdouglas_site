import type { Metadata } from 'next'
import { listReports } from '@/lib/reports/reports'
import { DenunciaActions } from './denuncia-actions'

export const metadata: Metadata = { title: 'Denúncias' }
export const dynamic = 'force-dynamic'

const TARGET_LABEL: Record<string, string> = {
  POST: 'Post',
  COMMENT: 'Comentário',
  FORUM_THREAD: 'Tópico do fórum',
  FORUM_REPLY: 'Resposta do fórum',
  TRACK: 'Música',
  USER: 'Usuário',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS = [
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'RESOLVED', label: 'Resolvidas' },
  { value: 'DISMISSED', label: 'Descartadas' },
  { value: 'ALL', label: 'Todas' },
] as const

export default async function AdminDenunciasPage({ searchParams }: PageProps) {
  const { status: statusParam } = await searchParams
  const status = (STATUS_TABS.some((t) => t.value === statusParam) ? statusParam : 'PENDING') as
    | 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'ALL'

  const { reports } = await listReports(status)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Denúncias</h1>
      </div>

      <div className="mb-5 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/denuncias?status=${tab.value}`}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium border transition',
              status === tab.value
                ? 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:border-neutral-500',
            ].join(' ')}
          >
            {tab.label}
          </a>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Nenhuma denúncia nesta categoria.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {TARGET_LABEL[r.targetType] ?? r.targetType}
                  </span>
                  <p className="mt-2 text-sm text-neutral-200">{r.reason}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Denunciado por {r.reporter.name || r.reporter.username || 'usuário'} ·{' '}
                    {new Date(r.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {r.status === 'PENDING' ? (
                  <DenunciaActions id={r.id} />
                ) : (
                  <span className={[
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    r.status === 'RESOLVED'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700',
                  ].join(' ')}>
                    {r.status === 'RESOLVED' ? 'Resolvida' : 'Descartada'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
