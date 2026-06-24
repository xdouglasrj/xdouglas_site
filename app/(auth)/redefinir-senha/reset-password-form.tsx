'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { isPasswordValid, PasswordStrengthMeter } from '@/components/auth/password-strength'

const fieldClassName =
  'bg-white/5 border-gate-azure text-white placeholder:text-white/30 focus:border-gate-pink focus:ring-gate-pink/20'
const buttonClassName = 'bg-gate-pink hover:opacity-90 focus-visible:ring-gate-pink'

type TokenStatus = 'checking' | 'valid' | 'used' | 'invalid'

function BackHomeButton() {
  return (
    <Link href="/">
      <Button type="button" fullWidth className={buttonClassName}>
        Voltar para o início
      </Button>
    </Link>
  )
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(token ? 'checking' : 'invalid')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    fetch(`/api/auth/reset-password/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json()
        setTokenStatus(res.ok ? data.status : 'invalid')
      })
      .catch(() => setTokenStatus('invalid'))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const pw = passwordRef.current?.value ?? ''
    const confirm = confirmRef.current?.value ?? ''

    if (!isPasswordValid(pw)) {
      setFieldError('A senha precisa ter no mínimo 8 caracteres, 2 letras maiúsculas e 2 caracteres especiais.')
      return
    }

    if (pw !== confirm) {
      setFieldError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setError('Muitas tentativas. Aguarde antes de tentar novamente.')
          return
        }
        if (data.code === 'TOKEN_ALREADY_USED') {
          setTokenStatus('used')
          return
        }
        if (data.code === 'INVALID_TOKEN') {
          setTokenStatus('invalid')
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

  if (tokenStatus === 'checking') {
    return <p className="text-sm text-gate-blue">Verificando link…</p>
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="error" message="Link inválido ou expirado. Solicite uma nova redefinição de senha." />
        <BackHomeButton />
      </div>
    )
  }

  if (tokenStatus === 'used') {
    return (
      <div className="flex flex-col gap-4">
        <Alert
          variant="warning"
          message="Esta senha (ou este link) já foi alterada anteriormente. Solicite uma nova redefinição caso precise trocar a senha novamente."
        />
        <BackHomeButton />
      </div>
    )
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

      <div>
        <Input
          ref={passwordRef}
          type="password"
          label="Nova senha"
          placeholder="••••••••"
          autoComplete="new-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError ?? undefined}
          required
          className={fieldClassName}
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <Input
        ref={confirmRef}
        type="password"
        label="Confirmar nova senha"
        placeholder="••••••••"
        autoComplete="new-password"
        required
        className={fieldClassName}
      />

      <Button
        type="submit"
        fullWidth
        loading={loading}
        disabled={!isPasswordValid(password)}
        className={`mt-1 ${buttonClassName}`}
      >
        {loading ? 'Salvando…' : 'Redefinir senha'}
      </Button>
    </form>
  )
}
