'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

const fieldClassName =
  'bg-white/5 border-gate-azure text-white placeholder:text-white/30 focus:border-gate-pink focus:ring-gate-pink/20'
const buttonClassName = 'bg-gate-pink hover:opacity-90 focus-visible:ring-gate-pink'

export function ForgotPasswordForm() {
  const identifierRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const identifier = identifierRef.current?.value ?? ''

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Muitas tentativas. Aguarde antes de tentar novamente.')
          return
        }
        setError(data.error ?? 'Erro ao processar o pedido')
        return
      }

      // Sempre mostra a mesma mensagem de sucesso, exista ou não a conta
      setSent(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Alert
        variant="success"
        message="Se encontrarmos uma conta com esses dados, enviaremos um email com instruções para redefinir sua senha."
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {error && <Alert variant="error" message={error} />}

      <Input
        ref={identifierRef}
        type="text"
        label="Email ou usuário"
        placeholder="seu_usuario ou seu@email.com"
        autoComplete="username"
        autoFocus
        required
        className={fieldClassName}
      />

      <Button type="submit" fullWidth loading={loading} className={`mt-1 ${buttonClassName}`}>
        {loading ? 'Enviando…' : 'Enviar link de redefinição'}
      </Button>
    </form>
  )
}
