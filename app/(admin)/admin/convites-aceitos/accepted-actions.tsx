'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AcceptedActionsProps {
  id: string
  email: string
  registrationUrl: string
}

export function AcceptedActions({ id, email, registrationUrl }: AcceptedActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir o convite de "${email}"? O cadastro dele será cancelado e o email poderá pedir convite de novo.`)) return
    setBusy(true)
    try {
      await fetch(`/api/admin/waitlist/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignora
    }
  }

  return (
    <div className="flex items-center gap-2 justify-end">
      <button
        onClick={copyLink}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60 transition-colors"
      >
        {copied ? 'Copiado!' : 'Copiar link'}
      </button>
      <button
        onClick={handleDelete}
        disabled={busy}
        className="px-2.5 py-1 rounded-md text-xs font-medium border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40"
      >
        Excluir
      </button>
    </div>
  )
}
