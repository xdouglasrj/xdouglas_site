'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/avatar'
import { FollowButton } from '@/components/profile/follow-button'

interface PersonItem {
  id: string
  handle: string
  displayName: string
  photoUrl: string | null
  isFollowing: boolean | null
}

interface FollowListPageProps {
  userId: string
  type: 'followers' | 'following'
}

export function FollowListPage({ userId, type }: FollowListPageProps) {
  const [people, setPeople] = useState<PersonItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback(
    async (targetPage: number) => {
      const params = new URLSearchParams({ userId, type, page: String(targetPage) })
      const res = await fetch(`/api/social/follow/list?${params}`)
      if (!res.ok) return { users: [], hasMore: false }
      return res.json()
    },
    [userId, type]
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPage(1)
      .then((data) => {
        if (!active) return
        setPeople(data.users ?? [])
        setHasMore(!!data.hasMore)
        setPage(1)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [fetchPage])

  async function loadMore() {
    if (loadingMore) return
    setLoadingMore(true)
    try {
      const data = await fetchPage(page + 1)
      setPeople((prev) => [...prev, ...(data.users ?? [])])
      setHasMore(!!data.hasMore)
      setPage((p) => p + 1)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-white/40">Carregando...</p>
  }

  if (people.length === 0) {
    return (
      <p className="text-sm text-white/40">
        {type === 'followers' ? 'Ninguém segue esse perfil ainda.' : 'Esse perfil ainda não segue ninguém.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {people.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-2 transition hover:bg-white/5">
          <Link href={`/perfil/${p.handle}`} className="flex min-w-0 items-center gap-3">
            <Avatar photoUrl={p.photoUrl} alt={p.displayName} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{p.displayName}</p>
              <p className="truncate text-xs text-gate-blue">@{p.handle}</p>
            </div>
          </Link>
          {p.isFollowing !== null && <FollowButton userId={p.id} initialFollowing={p.isFollowing} />}
        </div>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-3 self-center rounded-md border border-gate-azure px-4 py-1.5 text-xs font-semibold text-white/80 transition hover:text-white disabled:opacity-60"
        >
          {loadingMore ? 'Carregando…' : 'Carregar mais'}
        </button>
      )}
    </div>
  )
}
