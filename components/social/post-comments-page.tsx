'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ReportButton } from './report-button'
import { CommentRateLimitModal } from './comment-rate-limit-modal'

const COMMENT_MAX_LENGTH = 500
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

interface CommentAuthor {
  handle: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
}

interface CommentView {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

interface PostView {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
}

function authorName(a: { name: string | null; artisticName: string | null }) {
  return a.name || a.artisticName || 'Membro'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

export function PostCommentsPage({ postId }: { postId: string }) {
  const [post, setPost] = useState<PostView | null>(null)
  const [comments, setComments] = useState<CommentView[] | null>(null)
  const [totalComments, setTotalComments] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch(`/api/social/posts/${postId}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/social/posts/${postId}/comments?all=1&limit=${PAGE_SIZE_OPTIONS[0]}`).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([postData, commentsData]) => {
        if (!active) return
        if (!postData?.post) {
          setError('Publicação não encontrada.')
          return
        }
        setPost(postData.post)
        setComments(commentsData?.comments ?? [])
        setTotalComments(commentsData?.total ?? 0)
        setOffset(commentsData?.comments?.length ?? 0)
      })
      .catch(() => {
        if (active) setError('Erro de conexão.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [postId])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments?all=1&limit=${pageSize}&offset=${offset}`)
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...(data.comments ?? []), ...(prev ?? [])])
        setTotalComments(data.total ?? totalComments)
        setOffset((o) => o + (data.comments?.length ?? 0))
      }
    } finally {
      setLoadingMore(false)
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (sending || !newComment.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...(prev ?? []), data.comment])
        setTotalComments((t) => t + 1)
        setOffset((o) => o + 1)
        setNewComment('')
      } else if (res.status === 429 && data.retryAt) {
        setRateLimitRetryAt(data.retryAt)
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-sm text-white/40">Carregando…</p>
  if (error || !post) return <p className="text-sm text-red-400">{error ?? 'Publicação não encontrada.'}</p>

  return (
    <div className="w-full max-w-xl">
      <Link href="/inicio" className="text-xs text-white/40 hover:text-gate-pink">
        ← Voltar ao feed
      </Link>

      <article className="mt-4 rounded-lg border border-gate-azure bg-white/5 p-4">
        <p className="text-sm font-semibold text-white">{authorName(post.author)}</p>
        <p className="text-xs text-white/40">{formatDate(post.createdAt)}</p>
        <p className="mt-3 text-sm text-white/90 whitespace-pre-wrap break-words">{post.content}</p>
      </article>

      <h2 className="mt-6 text-sm font-semibold text-gate-blue uppercase tracking-wide">
        Comentários ({totalComments})
      </h2>

      <div className="mt-3 flex flex-col gap-3">
        {comments && totalComments > offset && (
          <div className="flex items-center justify-center gap-2 pb-1">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-xs font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-60"
            >
              {loadingMore ? 'Carregando…' : `Carregar mais (${totalComments - offset} restantes)`}
            </button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-md border border-gate-azure bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-gate-pink"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n} className="bg-gate-bg">
                  {n} por vez
                </option>
              ))}
            </select>
          </div>
        )}

        {comments?.map((c) => (
          <div key={c.id} className="flex gap-2">
            <div className="w-7 h-7 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
              {c.author.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.author.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-gate-blue">{authorName(c.author).charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs">
                <span className="font-semibold text-white">{authorName(c.author)}</span>{' '}
                <span className="text-white/30">{formatDate(c.createdAt)}</span>
              </p>
              <p className="text-sm text-white/80 break-words">{c.content}</p>
              <ReportButton targetType="COMMENT" targetId={c.id} />
            </div>
          </div>
        ))}

        {comments?.length === 0 && <p className="text-xs text-white/30">Nenhum comentário ainda.</p>}

        <form onSubmit={submitComment} className="mt-2 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="Escreva um comentário…"
              className="flex-1 rounded-md border border-gate-azure bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-gate-pink"
            />
            <button
              type="submit"
              disabled={sending || !newComment.trim()}
              className="rounded-md bg-gate-pink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              Enviar
            </button>
          </div>
          <span className="self-end text-[11px] text-white/30">{newComment.length}/{COMMENT_MAX_LENGTH}</span>
        </form>
      </div>

      {rateLimitRetryAt && (
        <CommentRateLimitModal retryAt={rateLimitRetryAt} onClose={() => setRateLimitRetryAt(null)} />
      )}
    </div>
  )
}
