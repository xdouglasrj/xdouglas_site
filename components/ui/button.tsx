import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

// ============================================================
// Variantes
// ============================================================

const variants = {
  primary:
    'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-500',
  secondary:
    'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-900 focus-visible:ring-neutral-500',
  ghost:
    'bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800 focus-visible:ring-neutral-500',
  danger:
    'bg-red-700 text-white hover:bg-red-600 active:bg-red-800 focus-visible:ring-red-500',
} as const

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
} as const

// ============================================================
// Props
// ============================================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  fullWidth?: boolean
}

// ============================================================
// Componente
// ============================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          // Base
          'inline-flex items-center justify-center gap-2',
          'rounded-md font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950',
          'disabled:opacity-50 disabled:pointer-events-none',
          'select-none cursor-pointer',
          // Variante e tamanho
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
