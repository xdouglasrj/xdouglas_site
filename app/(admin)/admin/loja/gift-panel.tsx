'use client'

import { useState } from 'react'

const ITEM_OPTIONS = [
  { value: 'PRIORITY_INVITE', label: 'Convite prioritário' },
  { value: 'PIN_TRACK_COMMENT', label: 'Destacar comentário na própria música' },
  { value: 'FEATURE_TRACK', label: 'Destaque de faixa' },
  { value: 'EXTRA_STORAGE', label: 'Armazenamento extra (+200MB)' },
  { value: 'MAPPING_ACCESS', label: 'Mapeamento ativado (30 dias)' },
  { value: 'APP_PREMIUM', label: 'Conta premium no app (30 dias)' },
  { value: 'PIN_FEED_POST', label: 'Fixar comentário no feed' },
] as const

export function GiftPanel() {
  const [mode, setMode] = useState<'points' | 'item'>('points')
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [itemKey, setItemKey] = useState<typeof ITEM_OPTIONS[number]['value']>('PRIORITY_INVITE')
  const [referEmail, setReferEmail] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const body =
        mode === 'points'
          ? { mode, email, amount: Number(amount), description }
          : { mode, email, itemKey, referEmail: itemKey === 'PRIORITY_INVITE' ? referEmail : undefined }

      const res = await fetch('/api/admin/store/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        alert('Presente enviado!')
        setEmail('')
        setAmount('')
        setDescription('')
        setReferEmail('')
      } else {
        alert(data.error ?? 'Erro ao presentear')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-white">Presentear usuário</h2>

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setMode('points')}
          className={`px-3 py-1.5 rounded-md border ${mode === 'points' ? 'border-gate-pink text-gate-pink bg-gate-pink/10' : 'border-neutral-700 text-neutral-400'}`}
        >
          Pontos brutos
        </button>
        <button
          type="button"
          onClick={() => setMode('item')}
          className={`px-3 py-1.5 rounded-md border ${mode === 'item' ? 'border-gate-pink text-gate-pink bg-gate-pink/10' : 'border-neutral-700 text-neutral-400'}`}
        >
          Item pronto
        </button>
      </div>

      <input
        type="email"
        required
        placeholder="Email do usuário"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
      />

      {mode === 'points' ? (
        <>
          <input
            type="number"
            required
            min={1}
            placeholder="Quantidade de pontos"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
          <input
            required
            placeholder="Motivo (aparece no histórico do usuário)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
        </>
      ) : (
        <>
          <select
            value={itemKey}
            onChange={(e) => setItemKey(e.target.value as typeof itemKey)}
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          >
            {ITEM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {itemKey === 'PRIORITY_INVITE' && (
            <input
              type="email"
              required
              placeholder="Email de quem ele vai indicar"
              value={referEmail}
              onChange={(e) => setReferEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
            />
          )}
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-gate-pink px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        {busy ? 'Enviando...' : 'Presentear'}
      </button>
    </form>
  )
}
