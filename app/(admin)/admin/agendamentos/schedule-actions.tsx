'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ScheduleActions({ trackId }: { trackId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancelar este agendamento? A música volta a ser um rascunho aguardando aprovação manual.')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/musicas/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelSchedule' }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        alert(body?.error ?? 'Erro ao cancelar agendamento.')
        return
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={busy}
      className="text-xs font-medium text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40"
    >
      Cancelar agendamento
    </button>
  )
}
