'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WaitlistActionsProps {
  id: string
  email: string
}

export function WaitlistActions({ id, email }: WaitlistActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleAccept() {
    setBusy(true)
    try {
      await fetch(`/api/admin/waitlist/${id}`, { method: 'PATCH' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    if (!confirm(`Rejeitar o pedido de convite de "${email}"? Esta ação não pode ser desfeita.`)) return
    setBusy(true)
    try {
      await fetch(`/api/admin/waitlist/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={handleAccept}
        disabled={busy}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-800/60 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-40"
      >
        Aceitar
      </button>
      <button
        onClick={handleReject}
        disabled={busy}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40"
      >
        Rejeitar
      </button>
    </div>
  )
}
