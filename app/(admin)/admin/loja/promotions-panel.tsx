'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PointsPromotion } from '@prisma/client'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function PromotionsPanel({ promotions }: { promotions: PointsPromotion[] }) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [multiplier, setMultiplier] = useState('2')
  const [mode, setMode] = useState<'weekday' | 'date'>('weekday')
  const [weekday, setWeekday] = useState('2')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const body =
        mode === 'weekday'
          ? { label, multiplier: Number(multiplier), weekday: Number(weekday) }
          : { label, multiplier: Number(multiplier), startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString() }

      const res = await fetch('/api/admin/store/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        setLabel('')
        router.refresh()
      } else {
        alert(data.error ?? 'Erro ao criar promoção')
      }
    } finally {
      setBusy(false)
    }
  }

  async function toggle(promo: PointsPromotion) {
    setBusy(true)
    try {
      await fetch(`/api/admin/store/promotions/${promo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promo.active }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-4">
      <h2 className="text-sm font-semibold text-white">Promoções (XP em dobro etc.)</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          required
          placeholder="Nome (ex: Terça da sorte)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-20 rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200"
          />
          <span className="self-center text-xs text-neutral-500">multiplicador (ex: 2 = pontos em dobro)</span>
        </div>

        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setMode('weekday')} className={`px-3 py-1.5 rounded-md border ${mode === 'weekday' ? 'border-gate-pink text-gate-pink bg-gate-pink/10' : 'border-neutral-700 text-neutral-400'}`}>
            Dia da semana fixo
          </button>
          <button type="button" onClick={() => setMode('date')} className={`px-3 py-1.5 rounded-md border ${mode === 'date' ? 'border-gate-pink text-gate-pink bg-gate-pink/10' : 'border-neutral-700 text-neutral-400'}`}>
            Período específico
          </button>
        </div>

        {mode === 'weekday' ? (
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200">
            {WEEKDAYS.map((day, i) => (
              <option key={i} value={i}>{day}</option>
            ))}
          </select>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200" />
            <input type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} className="rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-200" />
          </div>
        )}

        <button type="submit" disabled={busy} className="w-full rounded-md bg-gate-pink px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">
          Criar promoção
        </button>
      </form>

      <ul className="space-y-1.5 pt-2 border-t border-neutral-800">
        {promotions.length === 0 && <li className="text-xs text-neutral-600">Nenhuma promoção criada ainda.</li>}
        {promotions.map((p) => (
          <li key={p.id} className="flex items-center justify-between text-xs">
            <span className={p.active ? 'text-neutral-300' : 'text-neutral-600'}>
              {p.label} · {p.multiplier}x · {p.weekday !== null ? WEEKDAYS[p.weekday] : `${new Date(p.startAt!).toLocaleDateString('pt-BR')} a ${new Date(p.endAt!).toLocaleDateString('pt-BR')}`}
            </span>
            <button onClick={() => toggle(p)} disabled={busy} className="text-neutral-500 hover:text-neutral-300">
              {p.active ? 'Desativar' : 'Ativar'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
