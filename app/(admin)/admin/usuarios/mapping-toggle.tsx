'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function MappingToggle({ userId, enabled }: { userId: string; enabled: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    const next = !enabled
    if (next && !confirm('Liberar a dashboard de estatísticas (Mapeamento) para este usuário?')) return
    if (!next && !confirm('Revogar o acesso à dashboard de estatísticas deste usuário?')) return

    setBusy(true)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/mapping`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors disabled:opacity-50',
        enabled
          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 hover:bg-emerald-900/60'
          : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700',
      ].join(' ')}
      title={enabled ? 'Clique para revogar o acesso' : 'Clique para liberar o acesso'}
    >
      {enabled ? 'Ativado' : 'Desativado'}
    </button>
  )
}
