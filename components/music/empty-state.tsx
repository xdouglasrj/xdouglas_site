interface EmptyStateProps {
  title?: string
  message?: string
  filtered?: boolean
  onClearFilter?: () => void
}

export function EmptyState({
  title = 'Nenhuma música encontrada',
  message = 'Novas faixas chegam em breve.',
  filtered = false,
  onClearFilter,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-gate-azure flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gate-blue"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 19V6l12-3v13" />
          <circle cx="6" cy="19" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-gate-blue max-w-xs">{message}</p>

      {filtered && onClearFilter && (
        <button
          onClick={onClearFilter}
          className="mt-4 text-sm text-gate-pink hover:opacity-80 transition-opacity"
        >
          Limpar filtro
        </button>
      )}
    </div>
  )
}
