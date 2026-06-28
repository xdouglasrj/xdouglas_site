'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ReportButton } from './report-button'
import { CommentRateLimitModal } from './comment-rate-limit-modal'

const COMMENT_MAX_LENGTH = 500

export interface FeedPostView {
  id: string
  content: string
  createdAt: string
  author: {
    id: string
    handle: string | null
    name: string | null
    artisticName: string | null
    photoUrl: string | null
  }
  likeCount: number
  commentCount: number
  likedByMe: boolean
}

interface CommentView {
  id: string
  content: string
  createdAt: string
  author: { handle: string | null; name: string | null; artisticName: string | null; photoUrl: string | null }
}

function authorName(a: { name: string | null; artisticName: string | null }) {
  return a.artisticName || a.name || 'Membro'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

interface PostCardProps {
  post: FeedPostView
  currentUserId: string | null
  isAdmin: boolean
  onDeleted: (postId: string) => void
}

export function PostCard({ post, currentUserId, isAdmin, onDeleted }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<CommentView[] | null>(null)
  const [commentTotal, setCommentTotal] = useState(0)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<string | null>(null)

  const canDelete = isAdmin || (currentUserId !== null && currentUserId === post.author.id)

  async function deletePost() {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, { method: 'DELETE' })
      if (res.ok) onDeleted(post.id)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleLike() {
    if (busy) return
    setBusy(true)
    const nextLiked = !liked
    setLiked(nextLiked)
    setLikeCount((c) => c + (nextLiked ? 1 : -1))
    try {
      const res = await fetch(`/api/social/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) {
        setLiked(!nextLiked)
        setLikeCount((c) => c + (nextLiked ? -1 : 1))
      }
    } finally {
      setBusy(false)
    }
  }

  async function openComments() {
    setCommentsOpen((v) => !v)
    if (comments === null) {
      setLoadingComments(true)
      try {
        const res = await fetch(`/api/social/posts/${post.id}/comments`)
        const data = await res.json()
        setComments(data.comments ?? [])
        setCommentTotal(data.total ?? 0)
      } finally {
        setLoadingComments(false)
      }
    }
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault()
    if (sendingComment || !newComment.trim()) return
    setSendingComment(true)
    try {
      const res = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...(prev ?? []), data.comment].slice(-10))
        setCommentTotal((t) => t + 1)
        setCommentCount((c) => c + 1)
        setNewComment('')
      } else if (res.status === 429 && data.retryAt) {
        setRateLimitRetryAt(data.retryAt)
      }
    } finally {
      setSendingComment(false)
    }
  }

  return (
    <article className="rounded-lg border border-gate-azure bg-white/5 p-4">
      <div className="flex items-center gap-3">
        <Link href={`/perfil/${post.author.handle}`} className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
          {post.author.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
              <circle cx="12" cy="8" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
            </svg>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/perfil/${post.author.handle}`} className="text-sm font-semibold text-white hover:text-gate-pink truncate block">
            {authorName(post.author)}
          </Link>
          <p className="text-xs text-white/40">{formatDate(post.createdAt)}</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={deletePost}
            disabled={deleting}
            className="text-xs text-white/30 hover:text-red-400 transition disabled:opacity-50 shrink-0"
          >
            {deleting ? 'Excluindo…' : 'Excluir'}
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-white/90 whitespace-pre-wrap break-words">{post.content}</p>

      <div className="mt-3 flex items-center gap-5">
        <button
          type="button"
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs font-medium transition ${liked ? 'text-gate-pink' : 'text-white/50 hover:text-gate-pink'}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
          </svg>
          {likeCount}
        </button>

        <button
          type="button"
          onClick={openComments}
          className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-gate-pink transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {commentCount}
        </button>

        <ReportButton targetType="POST" targetId={post.id} />
      </div>

      {commentsOpen && (
        <div className="mt-4 border-t border-gate-azure pt-3 flex flex-col gap-3">
          {loadingComments && <p className="text-xs text-white/40">Carregando comentários…</p>}

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

          {comments?.length === 0 && !loadingComments && (
            <p className="text-xs text-white/30">Nenhum comentário ainda.</p>
          )}

          {commentTotal > 10 && (
            <Link
              href={`/comentarios/${post.id}`}
              className="self-start text-xs font-medium text-gate-pink hover:underline"
            >
              Ver todos os {commentTotal} comentários
            </Link>
          )}

          <form onSubmit={submitComment} className="flex flex-col gap-1">
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
                disabled={sendingComment || !newComment.trim()}
                className="rounded-md bg-gate-pink px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                Enviar
              </button>
            </div>
            <span className="self-end text-[11px] text-white/30">{newComment.length}/{COMMENT_MAX_LENGTH}</span>
          </form>
        </div>
      )}

      {rateLimitRetryAt && (
        <CommentRateLimitModal retryAt={rateLimitRetryAt} onClose={() => setRateLimitRetryAt(null)} />
      )}
    </article>
  )
}
