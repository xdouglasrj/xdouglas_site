'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WaitlistActionsProps {
  id: string
  email: string
}

interface AcceptResult {
  inviteCode: string
  registrationUrl: string
  accountType: 'artist' | 'visitor'
  email: string
}

export function WaitlistActions({ id, email }: WaitlistActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AcceptResult | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleAccept() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        alert(data.error ?? 'Erro ao aceitar o convite.')
      }
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

  async function copyLink() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.registrationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso — o campo é selecionável manualmente
    }
  }

  function closeAndRefresh() {
    setResult(null)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={handleAccept}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-800/60 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors disabled:opacity-40"
        >
          {busy ? '...' : 'Aceitar'}
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          className="px-2.5 py-1 rounded-md text-xs font-medium border border-red-900/60 bg-red-950/40 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-40"
        >
          Rejeitar
        </button>
      </div>

      {/* Modal com o link de convite gerado */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && closeAndRefresh()}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl text-left">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-800/60">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Convite aceito</h2>
                <p className="text-xs text-neutral-500">
                  Conta de {result.accountType === 'artist' ? 'músico/produtor' : 'ouvinte'} · {result.email}
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm text-neutral-400">
              Envie este link para a pessoa concluir o cadastro. A chave é de uso único e já
              vem embutida no link.
            </p>

            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              Chave de convite
            </label>
            <p className="mb-3 font-mono text-sm text-emerald-400">{result.inviteCode}</p>

            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              Link de cadastro
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={result.registrationUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-300 outline-none"
              />
              <button
                onClick={copyLink}
                className="shrink-0 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={closeAndRefresh}
                className="rounded-md border border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
