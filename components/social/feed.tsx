'use client'

import { useCallback, useEffect, useState } from 'react'
import { PostComposer } from './post-composer'
import { PostCard, type FeedPostView } from './post-card'

export function Feed() {
  const [posts, setPosts] = useState<FeedPostView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?page=1')
      if (!res.ok) {
        setError('Não foi possível carregar o feed.')
        return
      }
      const data = await res.json()
      setPosts(data.posts ?? [])
    } catch {
      setError('Erro de conexão.')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="mt-6 flex flex-col gap-4 max-w-xl">
      <PostComposer onPosted={load} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      {posts === null && !error && (
        <p className="text-sm text-white/40">Carregando feed…</p>
      )}

      {posts?.length === 0 && (
        <p className="text-sm text-white/40">Ainda não há publicações. Seja o primeiro a postar!</p>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
