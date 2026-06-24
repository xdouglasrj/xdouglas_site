import { WAITLIST_BREAKDOWN_TIPOS, type WaitlistStats } from '@/lib/admin/waitlist-stats'

const TIPO_LABEL: Record<string, string> = {
  DJ: 'DJ',
  PRODUTOR: 'Produtor',
  ARTISTA: 'Artista',
  MUSICO: 'Músico',
  OUVINTE: 'Ouvinte',
}

/** Contador global + breakdown por tipo — mesmo bloco em todas as páginas de convites/cadastros. */
export function WaitlistStatsBar({ total, pending, countByTipo }: WaitlistStats) {
  return (
    <div className="mb-8">
      <p className="text-sm text-neutral-500">
        {total} cadastro{total !== 1 ? 's' : ''} · {pending} aguardando convite
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
        {WAITLIST_BREAKDOWN_TIPOS.map((tipo) => (
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
    </div>
  )
}
