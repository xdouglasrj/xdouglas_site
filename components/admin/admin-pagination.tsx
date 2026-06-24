import Link from 'next/link'

export function AdminPagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number
  totalPages: number
  basePath: string
  query?: string
}) {
  if (totalPages <= 1) return null

  function hrefFor(p: number): string {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const linkClass = 'px-3 py-1.5 rounded-md text-xs font-medium border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60 transition-colors'
  const disabledClass = 'px-3 py-1.5 rounded-md text-xs font-medium border border-neutral-800 text-neutral-600 cursor-not-allowed'

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-neutral-500">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        {page <= 1 ? (
          <span className={disabledClass}>Anterior</span>
        ) : (
          <Link href={hrefFor(page - 1)} className={linkClass}>Anterior</Link>
        )}
        {page >= totalPages ? (
          <span className={disabledClass}>Próxima</span>
        ) : (
          <Link href={hrefFor(page + 1)} className={linkClass}>Próxima</Link>
        )}
      </div>
    </div>
  )
}
