'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface WaitlistActionsProps {
  id: string
  email: string
  hasReferrer?: boolean
}

interface AcceptResult {
  inviteCode: string
  registrationUrl: string
  accountType: 'artist' | 'visitor'
  email: string
  emailSent: boolean
}

export function WaitlistActions({ id, email, hasReferrer }: WaitlistActionsProps) {
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

  async function handleFlagAbuse() {
    if (!confirm(`Marcar a indicação de "${email}" como abusiva? Isso aplica o próximo nível de punição em quem indicou.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/waitlist/${id}/flag-abuse`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(`Punição aplicada — nível ${data.newLevel}${data.accountSuspended ? ' (conta suspensa)' : ''}`)
        router.refresh()
      } else {
        alert(data.error ?? 'Erro ao marcar abuso.')
      }
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
        {hasReferrer && (
          <button
            onClick={handleFlagAbuse}
            disabled={busy}
            title="Marcar a indicação como abusiva e punir quem indicou"
            className="px-2.5 py-1 rounded-md text-xs font-medium border border-orange-900/60 bg-orange-950/30 text-orange-400 hover:bg-orange-900/40 transition-colors disabled:opacity-40"
          >
            Marcar abuso
          </button>
        )}
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

            {result.emailSent ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-3 py-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-xs text-emerald-300">
                  Email enviado automaticamente para <strong>{result.email}</strong> com o link.
                  Você também pode copiar abaixo, se precisar reenviar.
                </p>
              </div>
            ) : (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/30 px-3 py-2">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-300">
                  Envio automático indisponível. Copie o link abaixo e envie para a pessoa
                  ({result.email}). A chave é de uso único.
                </p>
              </div>
            )}

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
