'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ReportButton } from './report-button'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

interface CommentAuthor {
  handle: string | null
  name: string | null
  artisticName: string | null
  photoUrl: string | null
}

interface CommentPost {
  id: string
  content: string
}

interface CommentView {
  id: string
  content: string
  createdAt: string
  author: CommentAuthor
  post: CommentPost
}

function authorName(a: { name: string | null; artisticName: string | null }) {
  return a.name || a.artisticName || 'Membro'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function postSnippet(content: string) {
  return content.length > 80 ? `${content.slice(0, 80)}…` : content
}

export function GlobalCommentsPage() {
  const [comments, setComments] = useState<CommentView[] | null>(null)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[0])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/social/comments?limit=${PAGE_SIZE_OPTIONS[0]}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active) return
        if (!data) {
          setError('Erro ao carregar comentários.')
          return
        }
        setComments(data.comments ?? [])
        setTotal(data.total ?? 0)
        setOffset(data.comments?.length ?? 0)
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
  }, [])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/social/comments?limit=${pageSize}&offset=${offset}`)
      const data = await res.json()
      if (res.ok) {
        setComments((prev) => [...(prev ?? []), ...(data.comments ?? [])])
        setTotal(data.total ?? total)
        setOffset((o) => o + (data.comments?.length ?? 0))
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="w-full max-w-xl">
      <h1 className="text-2xl font-bold text-white text-center">Comentários</h1>
      <p className="mt-2 max-w-md text-sm text-gate-blue text-center mx-auto">
        Todos os comentários da comunidade, dos mais recentes aos mais antigos — eles ficam
        disponíveis aqui até expirarem (mesmo prazo das publicações no feed).
      </p>

      {loading && <p className="mt-6 text-sm text-white/40">Carregando…</p>}
      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <div className="mt-6 flex flex-col gap-3">
          {comments?.length === 0 && (
            <p className="text-xs text-white/30 text-center">Nenhum comentário ainda.</p>
          )}

          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2 rounded-lg border border-gate-azure bg-white/5 p-3">
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
                  <span className="font-semibold text-white">{authorName(c.author)}</span>{' '}
                  <span className="text-white/30">{formatDate(c.createdAt)}</span>
                </p>
                <p className="text-sm text-white/80 break-words">{c.content}</p>
                <Link
                  href={`/comentarios/${c.post.id}`}
                  className="mt-1 block text-xs text-gate-blue hover:text-gate-pink break-words"
                >
                  em: &quot;{postSnippet(c.post.content)}&quot;
                </Link>
                <ReportButton targetType="COMMENT" targetId={c.id} />
              </div>
            </div>
          ))}

          {comments && total > offset && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-xs font-medium text-gate-blue transition hover:border-gate-pink hover:text-gate-pink disabled:opacity-60"
              >
                {loadingMore ? 'Carregando…' : `Carregar mais (${total - offset} restantes)`}
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
        </div>
      )}
    </div>
  )
}
