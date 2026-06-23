import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackForm } from '@/components/admin/track-form'

export const metadata: Metadata = { title: 'Nova música' }

export default function NovaMusicaPage() {
  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-neutral-500" aria-label="Navegação">
        <Link href="/admin/musicas" className="hover:text-neutral-300 transition-colors">
          Músicas
        </Link>
        <span>/</span>
        <span className="text-neutral-400">Nova música</span>
      </nav>

      <h1 className="text-xl font-semibold text-white mb-8">Nova música</h1>

      <TrackForm mode="create" />
    </div>
  )
}
