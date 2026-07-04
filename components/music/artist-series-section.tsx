import Image from 'next/image'
import Link from 'next/link'
import type { ArtistSeriesCard } from '@/lib/tracks/series'

// ============================================================
// Seção "Séries" no perfil do artista (V3 Plano 14) — cards das séries
// públicas do artista, cada um linkando para /series/[slug]. Renderizada no
// servidor. Não aparece se o artista não tem séries com episódios publicados.
// ============================================================

export function ArtistSeriesSection({ series }: { series: ArtistSeriesCard[] }) {
  if (series.length === 0) return null

  return (
    <section className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-widest text-gate-blue mb-3">Séries</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {series.map((s) => (
          <Link
            key={s.id}
            href={`/series/${s.slug}`}
            className="group rounded-xl border border-gate-azure bg-white/5 p-3 transition-colors hover:bg-white/[0.08]"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-white/5">
              {s.coverUrl ? (
                <Image src={s.coverUrl} alt="" fill sizes="200px" className="object-cover" />
              ) : (
                <span className="absolute inset-0 bg-gradient-to-br from-violet-900 to-gate-bg flex items-center justify-center text-2xl font-bold text-white/20">
                  {s.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-sm font-medium text-white group-hover:text-gate-pink transition-colors">
              {s.title}
            </p>
            <p className="text-xs text-gate-blue">
              {s.episodeCount} episódio{s.episodeCount !== 1 ? 's' : ''}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
