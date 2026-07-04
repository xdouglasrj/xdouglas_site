'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ReportButton } from '@/components/social/report-button'
import { useAuthPopup } from '@/components/auth/AuthPopupProvider'
import { usePlayer, type PlayerTrack } from '@/components/player/player-provider'

// ============================================================
// Comentários da faixa — V3 Plano 2
// Timestamp da música (clicável → seek), respostas aninhadas
// (1 nível), like com selo "Curtido pelo artista" e ordenação
// Top / Recentes / Timestamp. Fixado sempre no topo.
// ============================================================

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
  parentId: string | null
  timestampSeconds: number | null
  likeCount: number
  likedByMe: boolean
  likedByArtist: boolean
  author: CommentAuthor
  replies: TrackCommentView[]
}

type SortMode = 'top' | 'recent' | 'timestamp'

interface ArtistInfo {
  name: string
  photoUrl: string | null
}

function authorName(a: CommentAuthor) {
  return a.artisticName || a.name || 'Membro'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatTimestamp(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Reply "crua" da API (POST) — vira TrackCommentView com contadores zerados */
function withDefaults(comment: Partial<TrackCommentView> & { id: string }): TrackCommentView {
  return {
    content: '',
    createdAt: new Date().toISOString(),
    editedAt: null,
    pinned: false,
    parentId: null,
    timestampSeconds: null,
    likeCount: 0,
    likedByMe: false,
    likedByArtist: false,
    author: { id: '', handle: null, name: null, artisticName: null, photoUrl: null },
    replies: [],
    ...comment,
  }
}

export function TrackComments({
  trackId,
  trackOwnerId,
  isLoggedIn = true,
  playerTrack,
  artistInfo,
}: {
  trackId: string
  trackOwnerId: string | null
  isLoggedIn?: boolean
  /** Faixa da página, no shape do player global — para seek pelo timestamp */
  playerTrack: PlayerTrack
  /** Nome/foto do artista da faixa — para o selo "Curtido pelo artista" */
  artistInfo: ArtistInfo | null
}) {
  const { openLogin } = useAuthPopup()
  const player = usePlayer()
  const [comments, setComments] = useState<TrackCommentView[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isModerator, setIsModerator] = useState(false)
  const [allowComments, setAllowComments] = useState(true)
  const [sort, setSort] = useState<SortMode>('top')

  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Timestamp capturado quando o usuário começa a escrever com a faixa tocando
  const [capturedTimestamp, setCapturedTimestamp] = useState<number | null>(null)

  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyValue, setReplyValue] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pinningId, setPinningId] = useState<string | null>(null)

  // Seek pendente — quando o timestamp é clicado sem a faixa carregada,
  // toca a faixa da página e aplica o seek assim que ela carregar
  const pendingSeekRef = useRef<number | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/social/tracks/${trackId}/comments`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) {
          setComments(data?.comments ?? [])
          setAllowComments(data?.allowComments ?? true)
        }
      })
      .catch(() => {
        if (active) setComments([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    if (isLoggedIn) {
      fetch('/api/perfil')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (active) {
            setCurrentUserId(data?.user?.id ?? null)
            setIsAdmin(data?.user?.role === 'ADMIN')
            setIsModerator(data?.user?.role === 'MODERATOR')
          }
        })
        .catch(() => {})
    }

    return () => {
      active = false
    }
  }, [trackId, isLoggedIn])

  // Aplica seek pendente quando a faixa da página termina de carregar
  useEffect(() => {
    if (
      pendingSeekRef.current !== null &&
      player.currentTrack?.id === trackId &&
      player.duration > 0
    ) {
      player.seek(pendingSeekRef.current)
      pendingSeekRef.current = null
    }
  }, [player, trackId])

  // ── Timestamp ───────────────────────────────────────────────

  function captureTimestampIfPlaying() {
    if (capturedTimestamp !== null) return
    if (player.currentTrack?.id === trackId && player.isPlaying && !player.isVinheta) {
      setCapturedTimestamp(Math.floor(player.currentTime))
    }
  }

  function seekToTimestamp(seconds: number) {
    if (player.currentTrack?.id === trackId) {
      player.seek(seconds)
      if (!player.isPlaying) player.toggle()
    } else {
      pendingSeekRef.current = seconds
      player.playTrack(playerTrack)
    }
  }

  // ── Ações ───────────────────────────────────────────────────

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) {
      openLogin()
      return
    }
    if (sending || !newComment.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          timestampSeconds: capturedTimestamp,
        }),
      })
      if (!res.ok) {
        setError('Não foi possível enviar o comentário.')
        return
      }
      const data = await res.json()
      setComments((prev) => [...(prev ?? []), withDefaults(data.comment)])
      setNewComment('')
      setCapturedTimestamp(null)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSending(false)
    }
  }

  async function submitReply(parentId: string) {
    if (!isLoggedIn) {
      openLogin()
      return
    }
    if (sendingReply || !replyValue.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/social/tracks/${trackId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyValue.trim(), parentId }),
      })
      if (!res.ok) return
      const data = await res.json()
      const reply = withDefaults(data.comment)
      setComments((prev) =>
        prev?.map((c) =>
          // O servidor achata reply-de-reply para o mesmo pai — usa o
          // parentId que voltou na resposta
          c.id === reply.parentId ? { ...c, replies: [...c.replies, reply] } : c
        ) ?? prev
      )
      setReplyValue('')
      setReplyingTo(null)
    } finally {
      setSendingReply(false)
    }
  }

  async function toggleLike(comment: TrackCommentView) {
    if (!isLoggedIn) {
      openLogin()
      return
    }
    const nextLiked = !comment.likedByMe
    // Otimista — reverte se a API falhar
    updateComment(comment.id, (c) => ({
      ...c,
      likedByMe: nextLiked,
      likeCount: c.likeCount + (nextLiked ? 1 : -1),
      likedByArtist:
        currentUserId !== null && currentUserId === trackOwnerId ? nextLiked : c.likedByArtist,
    }))
    try {
      const res = await fetch(`/api/social/comments/${comment.id}/like`, {
        method: nextLiked ? 'POST' : 'DELETE',
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      updateComment(comment.id, (c) => ({ ...c, likeCount: data.likeCount, likedByMe: data.liked }))
    } catch {
      updateComment(comment.id, (c) => ({
        ...c,
        likedByMe: comment.likedByMe,
        likeCount: comment.likeCount,
        likedByArtist: comment.likedByArtist,
      }))
    }
  }

  /** Aplica uma transformação a um comentário (raiz ou reply) pela id */
  function updateComment(id: string, fn: (c: TrackCommentView) => TrackCommentView) {
    setComments((prev) =>
      prev?.map((c) => {
        if (c.id === id) return fn(c)
        if (c.replies.some((r) => r.id === id)) {
          return { ...c, replies: c.replies.map((r) => (r.id === id ? fn(r) : r)) }
        }
        return c
      }) ?? prev
    )
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
        updateComment(commentId, (c) => ({ ...c, content: data.comment.content, editedAt: data.comment.editedAt }))
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
        updateComment(comment.id, (c) => ({ ...c, pinned: data.comment.pinned }))
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
        setComments((prev) =>
          prev
            ?.filter((c) => c.id !== commentId)
            .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== commentId) })) ?? prev
        )
      }
    } finally {
      setDeletingId(null)
    }
  }

  // ── Ordenação (fixado sempre no topo) ───────────────────────

  const sorted = comments
    ? [...comments].sort((a, b) => {
        if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned)
        if (sort === 'top') return b.likeCount - a.likeCount
        if (sort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        // timestamp asc, sem timestamp por último
        if (a.timestampSeconds === null && b.timestampSeconds === null) return 0
        if (a.timestampSeconds === null) return 1
        if (b.timestampSeconds === null) return -1
        return a.timestampSeconds - b.timestampSeconds
      })
    : null

  const totalCount = comments
    ? comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)
    : 0

  // ── Render de um comentário (raiz ou reply) ─────────────────

  function renderComment(c: TrackCommentView, isReply: boolean) {
    const isOwner = currentUserId !== null && currentUserId === c.author.id
    const isTrackOwner = currentUserId !== null && currentUserId === trackOwnerId
    const canDelete = isOwner || isAdmin || isModerator || isTrackOwner
    const isEditing = editingId === c.id

    return (
      <div key={c.id} className={`flex gap-2 ${isReply ? 'mt-3' : ''}`}>
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
            {c.timestampSeconds !== null && (
              <button
                type="button"
                onClick={() => seekToTimestamp(c.timestampSeconds!)}
                className="ml-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gate-pink/15 text-gate-pink border border-gate-pink/40 hover:bg-gate-pink/25 transition-colors tabular-nums"
                aria-label={`Ouvir a partir de ${formatTimestamp(c.timestampSeconds)}`}
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M4 2.5v11a1 1 0 0 0 1.53.848l8-5.5a1 1 0 0 0 0-1.696l-8-5.5A1 1 0 0 0 4 2.5z" />
                </svg>
                {formatTimestamp(c.timestampSeconds)}
              </button>
            )}
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
                <button type="button" onClick={cancelEdit} className="text-xs text-white/40 hover:text-white">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-white/80 break-words whitespace-pre-wrap">{c.content}</p>
              {c.editedAt && (
                <p className="text-[11px] text-white/30 italic">Comentário editado {formatDate(c.editedAt)}</p>
              )}
              {c.likedByArtist && artistInfo && (
                <span className="mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-white/5 text-gate-blue border border-gate-azure">
                  <span className="w-3.5 h-3.5 rounded-full overflow-hidden bg-white/10 inline-flex items-center justify-center">
                    {artistInfo.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={artistInfo.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px]">{artistInfo.name.charAt(0).toUpperCase()}</span>
                    )}
                  </span>
                  Curtido pelo artista
                </span>
              )}
            </>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3 mt-0.5">
              <button
                type="button"
                onClick={() => toggleLike(c)}
                className={`inline-flex items-center gap-1 text-xs transition ${
                  c.likedByMe ? 'text-gate-pink' : 'text-white/30 hover:text-gate-pink'
                }`}
                aria-pressed={c.likedByMe}
                aria-label={c.likedByMe ? 'Descurtir comentário' : 'Curtir comentário'}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill={c.likedByMe ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                  <path d="M8 13.8S2 10.2 2 6.4C2 4.5 3.5 3 5.3 3c1.1 0 2.1.5 2.7 1.4C8.6 3.5 9.6 3 10.7 3 12.5 3 14 4.5 14 6.4c0 3.8-6 7.4-6 7.4z" strokeLinejoin="round" />
                </svg>
                {c.likeCount > 0 && <span className="tabular-nums">{c.likeCount}</span>}
              </button>
              {!isReply && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isLoggedIn) {
                      openLogin()
                      return
                    }
                    setReplyingTo(replyingTo === c.id ? null : c.id)
                    setReplyValue('')
                  }}
                  className="text-xs text-white/30 hover:text-gate-pink transition"
                >
                  Responder
                </button>
              )}
              {isOwner && (
                <button type="button" onClick={() => startEdit(c)} className="text-xs text-white/30 hover:text-gate-pink transition">
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
              {isAdmin && !isReply && (
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

          {/* Form de resposta */}
          {replyingTo === c.id && (
            <div className="mt-2 flex gap-2">
              <textarea
                autoFocus
                value={replyValue}
                onChange={(e) => setReplyValue(e.target.value)}
                maxLength={MAX_LENGTH}
                rows={2}
                placeholder={`Respondendo ${authorName(c.author)}…`}
                className="flex-1 rounded-md border border-gate-azure bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-gate-pink resize-none"
              />
              <button
                type="button"
                onClick={() => submitReply(c.id)}
                disabled={sendingReply || !replyValue.trim()}
                className="self-end rounded-md bg-gate-pink px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
          )}

          {/* Replies aninhadas — 1 nível, com ver/ocultar */}
          {c.replies.length > 0 && (
            <RepliesBlock count={c.replies.length}>
              <div className="border-l border-gate-azure/50 pl-3">
                {c.replies.map((r) => renderComment(r, true))}
              </div>
            </RepliesBlock>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="mt-10 pt-8 border-t border-gate-azure">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gate-blue uppercase tracking-wide">
          Comentários{!loading && comments ? ` (${totalCount})` : ''}
        </h2>
        {comments && comments.length > 1 && (
          <div className="flex items-center gap-1" role="group" aria-label="Ordenar comentários">
            {(
              [
                ['top', 'Top'],
                ['recent', 'Recentes'],
                ['timestamp', 'Timestamp'],
              ] as [SortMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSort(mode)}
                className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                  sort === mode ? 'bg-gate-pink/15 text-gate-pink' : 'text-white/40 hover:text-white'
                }`}
                aria-pressed={sort === mode}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-xs text-white/40">Carregando comentários…</p>}

        {sorted?.map((c) => renderComment(c, false))}

        {comments?.length === 0 && !loading && (
          <p className="text-xs text-white/30">Nenhum comentário ainda. Seja o primeiro!</p>
        )}

        {!isLoggedIn ? (
          <p className="mt-2 text-xs text-white/40">
            <button type="button" onClick={() => openLogin()} className="text-gate-pink hover:underline">
              Faça login
            </button>{' '}
            para comentar.
          </p>
        ) : allowComments ? (
          <form onSubmit={submitComment} className="mt-2 flex flex-col gap-1.5">
            {capturedTimestamp !== null && (
              <span className="self-start inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-full bg-gate-pink/15 text-gate-pink border border-gate-pink/40 tabular-nums">
                Comentando em {formatTimestamp(capturedTimestamp)}
                <button
                  type="button"
                  onClick={() => setCapturedTimestamp(null)}
                  className="hover:text-white transition-colors"
                  aria-label="Remover marcação de tempo"
                >
                  ✕
                </button>
              </span>
            )}
            <div className="flex gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onFocus={captureTimestampIfPlaying}
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
        ) : (
          <p className="mt-2 text-xs text-white/30">O artista desativou novos comentários nesta música.</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </section>
  )
}

// ── Bloco de replies com ver/ocultar ──────────────────────────

function RepliesBlock({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] font-medium text-gate-blue hover:text-gate-pink transition-colors"
        aria-expanded={open}
      >
        {open ? 'Ocultar respostas' : `Ver respostas (${count})`}
      </button>
      {open && children}
    </div>
  )
}
