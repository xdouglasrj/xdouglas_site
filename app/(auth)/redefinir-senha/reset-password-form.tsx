'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

const fieldClassName =
  'bg-white/5 border-gate-azure text-white placeholder:text-white/30 focus:border-gate-pink focus:ring-gate-pink/20'
const buttonClassName = 'bg-gate-pink hover:opacity-90 focus-visible:ring-gate-pink'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  if (!token) {
    return (
      <Alert
        variant="error"
        message="Link inválido. Solicite uma nova redefinição de senha."
      />
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const password = passwordRef.current?.value ?? ''
    const confirm = confirmRef.current?.value ?? ''

    if (password.length < 8) {
      setFieldError('A senha precisa ter pelo menos 8 caracteres')
      return
    }

    if (password !== confirm) {
      setFieldError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Muitas tentativas. Aguarde antes de tentar novamente.')
          return
        }
        setError(data.error ?? 'Erro ao redefinir a senha')
        return
      }

      setDone(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success" message="Senha redefinida com sucesso. Você já pode entrar com a nova senha." />
        <Link href="/?login=1">
          <Button type="button" fullWidth className={buttonClassName}>
            Ir para o login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && <Alert variant="error" message={error} />}

      <Input
        ref={passwordRef}
        type="password"
        label="Nova senha"
        placeholder="••••••••"
        autoComplete="new-password"
        autoFocus
        error={fieldError ?? undefined}
        required
        className={fieldClassName}
      />

      <Input
        ref={confirmRef}
        type="password"
        label="Confirmar nova senha"
        placeholder="••••••••"
        autoComplete="new-password"
        required
        className={fieldClassName}
      />

      <Button type="submit" fullWidth loading={loading} className={`mt-1 ${buttonClassName}`}>
        {loading ? 'Salvando…' : 'Redefinir senha'}
      </Button>
    </form>
  )
}
