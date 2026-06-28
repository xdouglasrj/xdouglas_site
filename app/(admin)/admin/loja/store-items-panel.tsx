'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreItem } from '@prisma/client'

const AUDIENCE_LABEL: Record<string, string> = {
  ARTIST: 'Artista',
  LISTENER: 'Ouvinte',
  BOTH: 'Ambos',
}

export function StoreItemsPanel({ items }: { items: StoreItem[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftPrice, setDraftPrice] = useState('')
  const [busy, setBusy] = useState(false)

  function startEdit(item: StoreItem) {
    setEditingId(item.id)
    setDraftPrice(String(item.price))
  }

  async function save(id: string) {
    const price = Number(draftPrice)
    if (!Number.isFinite(price) || price <= 0) {
      alert('Preço inválido')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/store/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Erro ao salvar')
        return
      }
      setEditingId(null)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(item: StoreItem) {
    setBusy(true)
    try {
      await fetch(`/api/admin/store/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-white">Catálogo</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-800">
            <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 uppercase">Item</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 uppercase">Pra quem</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 uppercase">Preço</th>
            <th className="text-left px-4 py-2 text-xs font-medium text-neutral-500 uppercase">Limites</th>
            <th className="text-right px-4 py-2 text-xs font-medium text-neutral-500 uppercase">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {items.map((item) => (
            <tr key={item.id} className={item.active ? '' : 'opacity-40'}>
              <td className="px-4 py-3 text-neutral-200">{item.label}</td>
              <td className="px-4 py-3 text-neutral-500">{AUDIENCE_LABEL[item.audience]}</td>
              <td className="px-4 py-3">
                {editingId === item.id ? (
                  <input
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    className="w-24 rounded border border-neutral-700 bg-neutral-950 px-2 py-1 text-neutral-200"
                  />
                ) : (
                  <span className="text-neutral-300 tabular-nums">{item.price.toLocaleString('pt-BR')}</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-neutral-600">
                {item.maxConcurrent && `máx. ${item.maxConcurrent} simultâneos · `}
                {item.saleWindowLimit && `${item.saleWindowLimit}/${item.saleWindowHours}h · `}
                {item.maxPurchasesPerUser && `${item.maxPurchasesPerUser}x por usuário · `}
                {item.durationHours && `dura ${item.durationHours}h`}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  {editingId === item.id ? (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => save(item.id)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-800/60 bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(item)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      >
                        Editar preço
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => toggleActive(item)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border border-neutral-700 text-neutral-400 hover:bg-neutral-800"
                      >
                        {item.active ? 'Desativar' : 'Ativar'}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
