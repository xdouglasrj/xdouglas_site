'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function LockThreadButton({ threadId, initialLocked }: { threadId: string; initialLocked: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function toggle() {
    const nextLocked = !initialLocked
    if (nextLocked && !confirm('Bloquear este tópico? Ninguém vai conseguir postar nova resposta.')) return

    setBusy(true)
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: nextLocked }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Erro ao atualizar o tópico')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
        initialLocked
          ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50'
          : 'border-orange-900/60 bg-orange-950/30 text-orange-400 hover:bg-orange-900/40'
      }`}
    >
      {busy ? '...' : initialLocked ? 'Desbloquear tópico' : 'Bloquear tópico'}
    </button>
  )
}
