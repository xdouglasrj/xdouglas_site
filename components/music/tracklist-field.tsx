'use client'

import { useMemo } from 'react'
import { parseTracklist, formatTimestamp } from '@/lib/tracks/tracklist'

// ============================================================
// Campo de tracklist (V3 Plano 10) — textarea + pré-visualização ao vivo
// das linhas interpretadas. Compartilhado pelos formulários de admin e de
// artista (estilo passado por prop). Linha inválida não bloqueia o upload:
// é apenas ignorada e contabilizada no aviso.
// ============================================================

interface TracklistFieldProps {
  value: string
  onChange: (value: string) => void
  labelClassName: string
  textareaClassName: string
}

export function TracklistField({
  value,
  onChange,
  labelClassName,
  textareaClassName,
}: TracklistFieldProps) {
  const { items, invalidCount } = useMemo(() => parseTracklist(value), [value])

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClassName}>
        Tracklist{' '}
        <span className="font-normal normal-case text-white/40">
          (opcional · uma linha por música: <code>06:52 Artista - Música</code>)
        </span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={'06:52 DJ Spen - When I Needed You Most\n12:30 2. Outro Artista - Outra Música'}
        className={`${textareaClassName} resize-y font-mono`}
      />

      {value.trim() !== '' && (
        <div className="mt-1 rounded-lg border border-gate-azure/60 bg-white/[0.03] p-3">
          {items.length === 0 ? (
            <p className="text-xs text-gate-pink">
              Nenhuma linha reconhecida. Use o formato <code>MM:SS Nome</code> ou{' '}
              <code>HH:MM:SS Nome</code>.
            </p>
          ) : (
            <>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-gate-blue">
                Pré-visualização ({items.length})
              </p>
              <ol className="flex flex-col gap-0.5">
                {items.map((item) => (
                  <li key={item.position} className="flex items-baseline gap-2 text-xs text-white/80">
                    <span className="w-5 shrink-0 text-right text-white/30">{item.position}</span>
                    <span className="w-14 shrink-0 tabular-nums text-gate-pink">
                      {formatTimestamp(item.startSeconds)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  </li>
                ))}
              </ol>
              {invalidCount > 0 && (
                <p className="mt-1.5 text-[11px] text-amber-400">
                  {invalidCount} linha{invalidCount !== 1 ? 's' : ''} sem tempo válido{' '}
                  {invalidCount !== 1 ? 'serão ignoradas' : 'será ignorada'}.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
