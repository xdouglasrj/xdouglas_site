'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DenunciaActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function act(action: 'resolve_keep' | 'resolve_delete' | 'dismiss') {
    if (busy) return
    if (action === 'resolve_delete' && !confirm('Remover o conteúdo denunciado? Essa ação não pode ser desfeita.')) return

    setBusy(true)
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={() => act('resolve_keep')}
        disabled={busy}
        className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700 disabled:opacity-50"
      >
        Manter
      </button>
      <button
        onClick={() => act('resolve_delete')}
        disabled={busy}
        className="rounded-md bg-red-950/60 px-3 py-1.5 text-xs font-medium text-red-400 border border-red-800/60 transition hover:bg-red-900/60 disabled:opacity-50"
      >
        Remover conteúdo
      </button>
      <button
        onClick={() => act('dismiss')}
        disabled={busy}
        className="rounded-md px-3 py-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-300 disabled:opacity-50"
      >
        Descartar
      </button>
    </div>
  )
}
