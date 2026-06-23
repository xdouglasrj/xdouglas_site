import { clsx } from 'clsx'

// ============================================================
// Variantes
// ============================================================

const variants = {
  error: {
    container: 'bg-red-950/50 border-red-800 text-red-300',
    icon: (
      <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    container: 'bg-emerald-950/50 border-emerald-800 text-emerald-300',
    icon: (
      <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    container: 'bg-amber-950/50 border-amber-800 text-amber-300',
    icon: (
      <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
  },
} as const

// ============================================================
// Props
// ============================================================

interface AlertProps {
  variant?: keyof typeof variants
  title?: string
  message: string
  className?: string
}

// ============================================================
// Componente
// ============================================================

export function Alert({ variant = 'error', title, message, className }: AlertProps) {
  const { container, icon } = variants[variant]

  return (
    <div
      role="alert"
      className={clsx(
        'flex gap-3 rounded-md border px-4 py-3 text-sm',
        container,
        className
      )}
    >
      {icon}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        <p className={title ? 'opacity-80' : ''}>{message}</p>
      </div>
    </div>
  )
}
