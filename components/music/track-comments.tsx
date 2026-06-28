'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ReportButton } from '@/components/social/report-button'

const MAX_LENGTH = 500

interface CommentAuthor {
  id: string
  handle: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
}

interface TrackCommentView {
  id: string
  content: string
  createdAt: string
  editedAt: string | null
  pinned: boolean
  author: CommentAuthor
}

function authorName(a: CommentAuthor) {
  return a.artisticName || a.name || 'Membro'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function TrackComments({ trackId }: { trackId: string }) {
  const [comments, setComments] = useState<TrackCommentView[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/social/tracks/${trackId}/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setComments(data?.comments ?? [])
      })
      .catch(() => {
        if (active) setComments([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    fetch('/api/perfil')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) {
          setCurrentUserId(data?.user?.id ?? null)
          setIsAdmin(data?.user?.role === 'ADMIN')
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [trackId])

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !newComment.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      if (!res.ok) {
        setError('Não foi possível enviar o comentário.')
        return
      }
      const data = await res.json()
      setComments((prev) => [...(prev ?? []), data.comment])
      setNewComment('')
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSending(false)
    }
  }

  function startEdit(c: TrackCommentView) {
    setEditingId(c.id)
    setEditValue(c.content)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveEdit(commentId: string) {
    if (savingEdit || !editValue.trim()) return
    setSavingEdit(true)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editValue.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => prev?.map((c) => (c.id === commentId ? data.comment : c)) ?? prev)
        cancelEdit()
      }
    } finally {
      setSavingEdit(false)
    }
  }

  async function togglePin(comment: TrackCommentView) {
    if (pinningId) return
    setPinningId(comment.id)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !comment.pinned }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments((prev) => {
          if (!prev) return prev
          const updated = prev.map((c) => (c.id === comment.id ? data.comment : c))
          return updated.slice().sort((a, b) => Number(b.pinned) - Number(a.pinned))
        })
      }
    } finally {
      setPinningId(null)
    }
  }

  async function deleteComment(commentId: string) {
    if (deletingId) return
    setDeletingId(commentId)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments/${commentId}`, { method: 'DELETE' })
      if (res.ok) {
        setComments((prev) => prev?.filter((c) => c.id !== commentId) ?? prev)
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="mt-10 pt-8 border-t border-gate-azure">
      <h2 className="text-sm font-semibold text-gate-blue uppercase tracking-wide mb-4">
        Comentários
      </h2>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-xs text-white/40">Carregando comentários…</p>}

        {comments?.map((c) => {
          const isOwner = currentUserId !== null && currentUserId === c.author.id
          const canDelete = isOwner || isAdmin
          const isEditing = editingId === c.id

          return (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
                {c.author.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.author.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gate-blue">{authorName(c.author).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs">
                  {c.author.handle ? (
                    <Link href={`/perfil/${c.author.handle}`} className="font-semibold text-white hover:text-gate-pink">
                      {authorName(c.author)}
                    </Link>
                  ) : (
                    <span className="font-semibold text-white">{authorName(c.author)}</span>
                  )}{' '}
                  <span className="text-white/30">{formatDate(c.createdAt)}</span>
                  {c.pinned && (
                    <span className="ml-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded bg-amber-950/60 text-amber-400 border border-amber-800/60">
                      <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M5.5 1.5l5.5 5.5-1 1-1.2-.2L6 10.5 3 13.5l3-3-2.3-2.8-.2-1.2 1-1z" />
                      </svg>
                      Fixado
                    </span>
                  )}
                </p>

                {isEditing ? (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      maxLength={MAX_LENGTH}
                      rows={2}
                      className="w-full rounded-md border border-gate-pink/60 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-gate-pink"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white/30">{editValue.length}/{MAX_LENGTH}</span>
                      <button
                        type="button"
                        onClick={() => saveEdit(c.id)}
                        disabled={savingEdit || !editValue.trim()}
                        className="text-xs font-semibold text-gate-pink hover:opacity-80 disabled:opacity-50"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs text-white/40 hover:text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-white/80 break-words whitespace-pre-wrap">{c.content}</p>
                    {c.editedAt && (
                      <p className="text-[11px] text-white/30 italic">
                        Comentário editado {formatDate(c.editedAt)}
                      </p>
                    )}
                  </>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-3 mt-0.5">
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-xs text-white/30 hover:text-gate-pink transition"
                      >
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        disabled={deletingId === c.id}
                        className="text-xs text-white/30 hover:text-red-400 transition disabled:opacity-50"
                      >
                        {deletingId === c.id ? 'Excluindo…' : 'Excluir'}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => togglePin(c)}
                        disabled={pinningId === c.id}
                        className="text-xs text-white/30 hover:text-amber-400 transition disabled:opacity-50"
                      >
                        {pinningId === c.id ? '…' : c.pinned ? 'Desafixar' : 'Fixar'}
                      </button>
                    )}
                    <ReportButton targetType="COMMENT" targetId={c.id} />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {comments?.length === 0 && !loading && (
          <p className="text-xs text-white/30">Nenhum comentário ainda. Seja o primeiro!</p>
        )}

        <form onSubmit={submitComment} className="mt-2 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={MAX_LENGTH}
              rows={2}
              placeholder="Escreva um comentário…"
              className="flex-1 rounded-md border border-gate-azure bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-gate-pink resize-none"
            />
            <button
              type="submit"
              disabled={sending || !newComment.trim()}
              className="self-end rounded-md bg-gate-pink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
          <span className="text-[11px] text-white/30 self-end">{newComment.length}/{MAX_LENGTH}</span>
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </section>
  )
}
