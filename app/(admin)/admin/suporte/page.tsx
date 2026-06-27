import type { Metadata } from 'next'
import { listTickets } from '@/lib/support/support'
import { SuporteActions } from './suporte-actions'

export const metadata: Metadata = { title: 'Suporte' }
export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<string, string> = {
  BUG: 'Problema / erro',
  SUGESTAO: 'Sugestão',
  DUVIDA: 'Dúvida',
  OUTRO: 'Outro',
}

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

const STATUS_TABS = [
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'RESOLVED', label: 'Resolvidos' },
  { value: 'ALL', label: 'Todos' },
] as const

export default async function AdminSuportePage({ searchParams }: PageProps) {
  const { status: statusParam } = await searchParams
  const status = (STATUS_TABS.some((t) => t.value === statusParam) ? statusParam : 'PENDING') as
    | 'PENDING' | 'RESOLVED' | 'ALL'

  const { tickets } = await listTickets(status)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Suporte</h1>
      </div>

      <div className="mb-5 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <a
            key={tab.value}
            href={`/admin/suporte?status=${tab.value}`}
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

      {tickets.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-12 text-center">
          <p className="text-neutral-500 text-sm">Nenhum chamado nesta categoria.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700">
                    {CATEGORY_LABEL[t.category] ?? t.category}
                  </span>
                  <p className="mt-2 text-sm text-neutral-200 whitespace-pre-wrap break-words">{t.message}</p>

                  {t.attachmentUrl ? (
                    <div className="mt-2">
                      {t.attachmentType === 'IMAGE' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.attachmentUrl} alt="Anexo" className="max-h-48 rounded-md border border-neutral-700" />
                      ) : (
                        <video src={t.attachmentUrl} controls className="max-h-48 rounded-md border border-neutral-700" />
                      )}
                    </div>
                  ) : t.attachmentType === 'VIDEO' && (
                    <p className="mt-2 text-xs italic text-neutral-500">
                      Vídeo excluído automaticamente após 7 dias.
                    </p>
                  )}

                  <p className="mt-2 text-xs text-neutral-500">
                    {t.user.name || t.user.username || t.user.handle || 'usuário'} ({t.user.email}) ·{' '}
                    {new Date(t.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {t.status === 'PENDING' ? (
                  <SuporteActions id={t.id} />
                ) : (
                  <span className="inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-950/60 text-emerald-400 border-emerald-800/60">
                    Resolvido
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
