'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserActionsProps {
  id: string
  username: string | null
  active: boolean
  blocked: boolean
}

export function UserActions({ id, username, active, blocked }: UserActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleApprove() {
    setBusy(true)
    try {
      await fetch(`/api/admin/cadastros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleBlock() {
    if (!confirm(`Bloquear "${username ?? id}"? O email, usuário e WhatsApp não poderão fazer um novo cadastro.`)) return
    setBusy(true)
    try {
      await fetch(`/api/admin/cadastros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block' }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleUnblock() {
    setBusy(true)
    try {
      await fetch(`/api/admin/cadastros/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock' }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (blocked) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={handleUnblock}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-xs font-medium border border-amber-800/60 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50 transition-colors disabled:opacity-40"
        >
          Desbloquear
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      {!active && (
        <button
          onClick={handleApprove}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-800/60 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-40"
        >
          Aprovar
        </button>
      )}
      <button
        onClick={handleBlock}
        disabled={busy}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40"
      >
        Bloquear
      </button>
    </div>
  )
}
