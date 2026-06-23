'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TrackActionsProps {
  trackId: string
  slug: string
  published: boolean
}

export function TrackActions({ trackId, slug, published }: TrackActionsProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleTogglePublish() {
    setBusy(true)
    try {
      await fetch(`/api/admin/musicas/${trackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', published: !published }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Remover "${slug}" permanentemente? Esta ação não pode ser desfeita.`)) return
    setBusy(true)
    try {
      await fetch(`/api/admin/musicas/${trackId}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1 justify-end">
      {/* Ver no site */}
      <Link
        href={`/musicas/${slug}`}
        target="_blank"
        className="p-1.5 text-neutral-600 hover:text-neutral-300 rounded transition-colors"
        title="Ver no site"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M9 1h6m0 0v6m0-6L7 9" />
        </svg>
      </Link>

      {/* Editar */}
      <Link
        href={`/admin/musicas/${trackId}/editar`}
        className="p-1.5 text-neutral-600 hover:text-neutral-300 rounded transition-colors"
        title="Editar"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 2l3 3-8 8H3v-3l8-8z" />
        </svg>
      </Link>

      {/* Publicar / Despublicar */}
      <button
        onClick={handleTogglePublish}
        disabled={busy}
        className="p-1.5 text-neutral-600 hover:text-neutral-300 rounded transition-colors disabled:opacity-40"
        title={published ? 'Despublicar' : 'Publicar'}
      >
        {published ? (
          <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 2v5M5 4l3-3 3 3M3 10l5 4 5-4M3 13h10" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 14V9M5 12l3 3 3-3M3 6l5-4 5 4M3 3h10" />
          </svg>
        )}
      </button>

      {/* Deletar */}
      <button
        onClick={handleDelete}
        disabled={busy}
        className="p-1.5 text-neutral-600 hover:text-red-500 rounded transition-colors disabled:opacity-40"
        title="Remover"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" />
        </svg>
      </button>
    </div>
  )
}
