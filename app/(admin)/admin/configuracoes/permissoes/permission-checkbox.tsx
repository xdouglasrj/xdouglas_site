'use client'

/** Checkbox custom em formato de pílula — usado na grade de permissões. */
export function PermissionCheckbox({
  label,
  checked,
  onChange,
  locked = false,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Trancado — exclusivo do ADMIN, não pode ser marcado/desmarcado. */
  locked?: boolean
}) {
  return (
    <label
      title={locked ? 'Exclusivo do ADMIN — não pode ser atribuído a moderadores' : undefined}
      className={[
        'inline-flex items-center gap-2 select-none rounded-full border px-3 py-1.5 text-xs font-medium transition',
        locked
          ? 'cursor-not-allowed border-neutral-800 bg-neutral-900/60 text-neutral-600'
          : checked
            ? 'cursor-pointer border-gate-pink bg-gate-pink/15 text-gate-pink'
            : 'cursor-pointer border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:border-gate-pink/50',
      ].join(' ')}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={locked ? false : checked}
        disabled={locked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={[
          'flex h-4 w-4 items-center justify-center rounded-full border transition',
          locked ? 'border-neutral-700' : checked ? 'border-gate-pink bg-gate-pink' : 'border-neutral-600',
        ].join(' ')}
        aria-hidden="true"
      >
        {locked ? (
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600">
            <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
            <path d="M5.5 7V4.8a2.5 2.5 0 0 1 5 0V7" />
          </svg>
        ) : checked ? (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#0a0c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8.5l3.2 3.2L13 4.5" />
          </svg>
        ) : null}
      </span>
      {label}
    </label>
  )
}
