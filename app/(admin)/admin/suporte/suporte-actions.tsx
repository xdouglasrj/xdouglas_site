'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SuporteActions({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function resolve() {
    if (busy) return
    setBusy(true)
    try {
      await fetch(`/api/admin/support/${id}`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        onClick={resolve}
        disabled={busy}
        className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-700 disabled:opacity-50"
      >
        Marcar como resolvido
      </button>
    </div>
  )
}
