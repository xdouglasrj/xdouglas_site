'use client'

import { useRef, useState } from 'react'

interface ProfileFormProps {
  email: string
  username: string | null
  artisticName: string | null
  phone: string | null
  initialName: string
  initialPhotoUrl: string | null
  initialShowEmail: boolean
  initialShowPhone: boolean
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ProfileForm({
  email,
  username,
  artisticName,
  phone,
  initialName,
  initialPhotoUrl,
  initialShowEmail,
  initialShowPhone,
}: ProfileFormProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl)
  const [photoState, setPhotoState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [showEmail, setShowEmail] = useState(initialShowEmail)
  const [showPhone, setShowPhone] = useState(initialShowPhone)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacyError, setPrivacyError] = useState<string | null>(null)

  async function handlePrivacyToggle(field: 'showEmail' | 'showPhone', value: boolean) {
    if (savingPrivacy) return
    setSavingPrivacy(true)
    setPrivacyError(null)

    const revert = field === 'showEmail' ? setShowEmail : setShowPhone
    revert(value)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        revert(!value)
        setPrivacyError('Não foi possível salvar.')
      }
    } catch {
      revert(!value)
      setPrivacyError('Erro de conexão.')
    } finally {
      setSavingPrivacy(false)
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setPhotoError(null)

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Formato não suportado. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('A imagem precisa ter até 5MB.')
      return
    }

    setPhotoState('uploading')
    try {
      const urlRes = await fetch('/api/perfil/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      })

      if (!urlRes.ok) {
        const err = await urlRes.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erro ao gerar URL de upload')
      }

      const { uploadUrl, storageKey, publicUrl } = await urlRes.json()

      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putRes.ok) throw new Error('Falha ao enviar a imagem')

      const patchRes = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoKey: storageKey, photoUrl: publicUrl }),
      })
      if (!patchRes.ok) throw new Error('Erro ao salvar a foto no perfil')

      setPhotoUrl(publicUrl)
      setPhotoState('idle')
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Erro no upload')
      setPhotoState('error')
      setTimeout(() => setPhotoState('idle'), 3000)
    }
  }

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (savingName || !name.trim()) return
    setSavingName(true)
    setNameMessage(null)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      setNameMessage(res.ok ? 'Nome atualizado.' : 'Erro ao atualizar nome.')
    } catch {
      setNameMessage('Erro ao atualizar nome.')
    } finally {
      setSavingName(false)
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (savingPassword) return
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('A nova senha precisa ter ao menos 8 caracteres.')
      return
    }

    setSavingPassword(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()

      if (!res.ok) {
        setPasswordError(
          data.code === 'INVALID_PASSWORD' ? 'Senha atual incorreta.' : 'Erro ao trocar senha.'
        )
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
    } catch {
      setPasswordError('Erro ao trocar senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-6 sm:gap-8">
      {/* Foto de perfil */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Foto de perfil</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
              </svg>
            )}
            {photoState === 'uploading' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_PHOTO_TYPES.join(',')}
              onChange={handlePhotoChange}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoState === 'uploading'}
              className="rounded-md bg-gate-pink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 w-fit"
            >
              {photoState === 'uploading' ? 'Enviando…' : 'Trocar foto'}
            </button>
            <span className="text-xs text-white/40">JPG, PNG ou WebP — até 5MB</span>
            {photoError && <span className="text-xs text-red-400">{photoError}</span>}
          </div>
        </div>
      </section>

      {/* Dados básicos (somente leitura) */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Conta</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-gate-blue">E-mail</dt>
            <dd className="text-white/80 truncate">{email}</dd>
          </div>
          {username && (
            <div className="flex justify-between gap-4">
              <dt className="text-gate-blue">Usuário</dt>
              <dd className="text-white/80 truncate">@{username}</dd>
            </div>
          )}
          {artisticName && (
            <div className="flex justify-between gap-4">
              <dt className="text-gate-blue">Nome artístico</dt>
              <dd className="text-white/80 truncate">{artisticName}</dd>
            </div>
          )}
          {phone && (
            <div className="flex justify-between gap-4">
              <dt className="text-gate-blue">WhatsApp</dt>
              <dd className="text-white/80 truncate">{phone}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Privacidade */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Privacidade</h2>
        <p className="mt-1 text-xs text-white/40">
          O admin sempre tem acesso a todos os seus dados. Estas opções controlam o que outros
          membros da comunidade podem ver no seu perfil.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/80">Mostrar meu e-mail para outros membros</span>
            <button
              type="button"
              role="switch"
              aria-checked={showEmail}
              aria-label="Mostrar e-mail para outros membros"
              onClick={() => handlePrivacyToggle('showEmail', !showEmail)}
              disabled={savingPrivacy}
              className={[
                'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                showEmail ? 'bg-gate-pink' : 'bg-white/15',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                  showEmail ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>

          {phone && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-white/80">Mostrar meu WhatsApp para outros membros</span>
              <button
                type="button"
                role="switch"
                aria-checked={showPhone}
                aria-label="Mostrar WhatsApp para outros membros"
                onClick={() => handlePrivacyToggle('showPhone', !showPhone)}
                disabled={savingPrivacy}
                className={[
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
                  showPhone ? 'bg-gate-pink' : 'bg-white/15',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-1 h-4 w-4 rounded-full bg-white transition-transform',
                    showPhone ? 'translate-x-6' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          )}
        </div>

        {privacyError && <p className="mt-3 text-xs text-red-400">{privacyError}</p>}
      </section>

      {/* Nome */}
      <form onSubmit={handleNameSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Nome</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          className="mt-3 w-full rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={savingName}
            className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {savingName ? 'Salvando…' : 'Salvar'}
          </button>
          {nameMessage && <span className="text-xs text-gate-blue">{nameMessage}</span>}
        </div>
      </form>

      {/* Senha */}
      <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gate-blue">Trocar senha</h2>

        <label className="mt-3 block text-xs text-gate-blue">Senha atual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />

        <label className="mt-3 block text-xs text-gate-blue">Nova senha</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          className="mt-1 w-full rounded-md border border-gate-azure bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-md bg-gate-pink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {savingPassword ? 'Salvando…' : 'Trocar senha'}
          </button>
          {passwordError && <span className="text-xs text-red-400">{passwordError}</span>}
          {passwordSuccess && <span className="text-xs text-emerald-400">Senha atualizada.</span>}
        </div>
      </form>
    </div>
  )
}
