import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import { clsx } from 'clsx'

// ============================================================
// Props
// ============================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

// ============================================================
// Componente
// ============================================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id: externalId, ...props }, ref) => {
    const generatedId = useId()
    const id = externalId ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-neutral-300"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={id}
          className={clsx(
            'h-10 w-full rounded-md px-3 text-sm',
            'bg-neutral-900 text-white',
            'border transition-colors duration-150',
            error
              ? 'border-red-500 focus:border-red-400 focus:ring-red-500/20'
              : 'border-neutral-700 focus:border-rose-500 focus:ring-rose-500/20',
            'focus:outline-none focus:ring-2',
            'placeholder:text-neutral-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'autofill:bg-neutral-900',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />

        {error && (
          <p id={`${id}-error`} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-neutral-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
