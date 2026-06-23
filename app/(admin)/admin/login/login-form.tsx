'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

// ============================================================
// Tipos
// ============================================================

interface LoginError {
  message: string
  code?: string
  fields?: Record<string, string[]>
}

// ============================================================
// Componente
// ============================================================

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/admin/dashboard'

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<LoginError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    const email = emailRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Erros de validação de campo
        if (data.issues) {
          const fields: Record<string, string> = {}
          for (const [key, msgs] of Object.entries(data.issues)) {
            fields[key] = (msgs as string[])[0]
          }
          setFieldErrors(fields)
          return
        }

        // Rate limit
        if (res.status === 429) {
          setError({
            message: data.error,
            code: 'RATE_LIMIT',
          })
          return
        }

        // Erro genérico
        setError({ message: data.error ?? 'Erro ao fazer login', code: data.code })
        return
      }

      // Sucesso — redireciona para o painel
      router.push(redirect)
      router.refresh()
    } catch {
      setError({ message: 'Erro de conexão. Tente novamente.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Erro global */}
      {error && (
        <Alert
          variant={error.code === 'RATE_LIMIT' ? 'warning' : 'error'}
          message={error.message}
        />
      )}

      <Input
        ref={emailRef}
        type="email"
        label="Email"
        placeholder="admin@xdouglas.com"
        autoComplete="email"
        autoFocus
        error={fieldErrors.email}
        required
      />

      <Input
        ref={passwordRef}
        type="password"
        label="Senha"
        placeholder="••••••••"
        autoComplete="current-password"
        error={fieldErrors.password}
        required
      />

      <Button
        type="submit"
        fullWidth
        loading={loading}
        className="mt-1"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
