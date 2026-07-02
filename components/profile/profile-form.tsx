'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface ProfileFormFieldsProps {
  email: string
  username: string | null
  handle: string | null
  artisticName: string | null
  phone: string | null
  initialName: string
  initialPhotoUrl: string | null
  initialShowContatosNoPerfil: boolean
  initialShowName: boolean
  initialShowMusicasNoPerfil: boolean
  initialShowEspacoUploadNoPerfil: boolean
  initialAllowComentariosNaMusica: boolean
  initialShowComentariosVisiveis: boolean
  isArtist: boolean
  onHandleChange?: (newHandle: string) => void
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type PrivacyField =
  | 'showContatosNoPerfil'
  | 'showName'
  | 'showMusicasNoPerfil'
  | 'showEspacoUploadNoPerfil'
  | 'allowComentariosNaMusica'
  | 'showComentariosVisiveis'

interface PrivacyToggleRowProps {
  label: string
  checked: boolean
  disabled: boolean
  onToggle: () => void
}

// Switch + cadeado: o cadeado fechado/vermelho deixa explícito que o dado
// está privado (visível só para você e o admin/moderador) quando o switch está OFF.
function PrivacyToggleRow({ label, checked, disabled, onToggle }: PrivacyToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-sm text-white/80">
        {checked ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-emerald-400" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path strokeLinecap="round" d="M8 11V7a4 4 0 0 1 8 0" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gate-pink" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path strokeLinecap="round" d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        )}
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 appearance-none items-center rounded-full border-0 p-0 transition-colors disabled:opacity-50',
          checked ? 'bg-gate-pink' : 'bg-white/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
    </div>
  )
}

export function ProfileFormFields({
  email,
  username,
  handle,
  artisticName,
  phone,
  initialName,
  initialPhotoUrl,
  initialShowContatosNoPerfil,
  initialShowName,
  initialShowMusicasNoPerfil,
  initialShowEspacoUploadNoPerfil,
  initialAllowComentariosNaMusica,
  initialShowComentariosVisiveis,
  isArtist,
  onHandleChange,
}: ProfileFormFieldsProps) {
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl)
  const [photoState, setPhotoState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initialName)
  const [savingName, setSavingName] = useState(false)
  const [nameMessage, setNameMessage] = useState<string | null>(null)

  const [artisticNameValue, setArtisticNameValue] = useState(artisticName ?? '')
  const [savingArtisticName, setSavingArtisticName] = useState(false)
  const [artisticNameMessage, setArtisticNameMessage] = useState<string | null>(null)

  const [handleValue, setHandleValue] = useState(handle ?? '')
  const [savingHandle, setSavingHandle] = useState(false)
  const [handleMessage, setHandleMessage] = useState<string | null>(null)
  const [handleError, setHandleError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const [showContatosNoPerfil, setShowContatosNoPerfil] = useState(initialShowContatosNoPerfil)
  const [showName, setShowName] = useState(initialShowName)
  const [showMusicasNoPerfil, setShowMusicasNoPerfil] = useState(initialShowMusicasNoPerfil)
  const [showEspacoUploadNoPerfil, setShowEspacoUploadNoPerfil] = useState(initialShowEspacoUploadNoPerfil)
  const [allowComentariosNaMusica, setAllowComentariosNaMusica] = useState(initialAllowComentariosNaMusica)
  const [showComentariosVisiveis, setShowComentariosVisiveis] = useState(initialShowComentariosVisiveis)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacyError, setPrivacyError] = useState<string | null>(null)

  const PRIVACY_SETTERS: Record<PrivacyField, (v: boolean) => void> = {
    showContatosNoPerfil: setShowContatosNoPerfil,
    showName: setShowName,
    showMusicasNoPerfil: setShowMusicasNoPerfil,
    showEspacoUploadNoPerfil: setShowEspacoUploadNoPerfil,
    allowComentariosNaMusica: setAllowComentariosNaMusica,
    showComentariosVisiveis: setShowComentariosVisiveis,
  }

  async function handlePrivacyToggle(field: PrivacyField, value: boolean) {
    if (savingPrivacy) return
    setSavingPrivacy(true)
    setPrivacyError(null)

    const setField = PRIVACY_SETTERS[field]
    setField(value)

    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        setField(!value)
        setPrivacyError('Não foi possível salvar.')
      } else {
        router.refresh()
      }
    } catch {
      setField(!value)
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

  async function handleArtisticNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (savingArtisticName || !artisticNameValue.trim()) return
    setSavingArtisticName(true)
    setArtisticNameMessage(null)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artisticName: artisticNameValue.trim() }),
      })
      setArtisticNameMessage(res.ok ? 'Nome artístico atualizado.' : 'Erro ao atualizar nome artístico.')
      if (res.ok) router.refresh()
    } catch {
      setArtisticNameMessage('Erro ao atualizar nome artístico.')
    } finally {
      setSavingArtisticName(false)
    }
  }

  async function handleHandleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (savingHandle) return
    setHandleError(null)
    setHandleMessage(null)

    const normalized = handleValue.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,24}$/.test(normalized)) {
      setHandleError('Use de 3 a 24 letras minúsculas, números ou "_".')
      return
    }

    setSavingHandle(true)
    try {
      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: normalized }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setHandleError(data.code === 'HANDLE_TAKEN' ? 'Esse @ já está em uso.' : 'Erro ao atualizar @.')
        return
      }

      setHandleValue(normalized)
      setHandleMessage('@ atualizado.')
      onHandleChange?.(normalized)
      router.refresh()
    } catch {
      setHandleError('Erro de conexão.')
    } finally {
      setSavingHandle(false)
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
    <div className="flex flex-col gap-3">
      {/* Foto de perfil */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Foto de perfil</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden bg-white/10 border border-gate-azure flex items-center justify-center">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gate-blue">
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
              </svg>
            )}
            {photoState === 'uploading' && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
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
              className="rounded-md bg-gate-pink px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60 w-fit"
            >
              {photoState === 'uploading' ? 'Enviando…' : 'Trocar foto'}
            </button>
            <span className="text-[11px] text-white/40">JPG, PNG ou WebP — até 5MB</span>
            {photoError && <span className="text-[11px] text-red-400">{photoError}</span>}
          </div>
        </div>
      </section>

      {/* Dados básicos (somente leitura) */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Conta</h2>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex justify-between gap-4">
            <dt className="text-gate-blue">E-mail</dt>
            <dd className="text-white/80 truncate">{email}</dd>
          </div>
          {username && (
            <div className="flex justify-between gap-4">
              <dt className="text-gate-blue">Usuário (login)</dt>
              <dd className="text-white/80 truncate">{username}</dd>
            </div>
          )}
          {phone && (
            <div className="flex justify-between gap-4">
              <dt className="text-gate-blue">WhatsApp</dt>
              <dd className="text-white/80 truncate">{phone}</dd>
            </div>
          )}
        </dl>
        <p className="mt-2 text-[11px] text-white/30">
          E-mail e WhatsApp só aparecem para outros membros se você ligar &quot;Mostrar meus contatos&quot; abaixo.
          {username && ' O usuário de login é privado — use o @ abaixo para a comunidade te encontrar.'}
        </p>
      </section>

      {/* @ público da comunidade */}
      <form onSubmit={handleHandleSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Seu @ na comunidade</h2>
        <p className="mt-1 text-[11px] text-white/40">
          É o que aparece no seu link de perfil e nas suas publicações — diferente do usuário de login.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-white/40">@</span>
          <input
            type="text"
            value={handleValue}
            onChange={(e) => setHandleValue(e.target.value.toLowerCase())}
            maxLength={24}
            className="min-w-0 flex-1 rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
          />
          <button
            type="submit"
            disabled={savingHandle}
            className="rounded-md bg-gate-pink px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {savingHandle ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        {handleError && <span className="mt-1.5 block text-[11px] text-red-400">{handleError}</span>}
        {handleMessage && <span className="mt-1.5 block text-[11px] text-emerald-400">{handleMessage}</span>}
      </form>

      {/* Privacidade */}
      <section className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Privacidade</h2>
        <p className="mt-1 text-[11px] text-white/40">
          O cadeado fechado indica que o servidor não envia esse dado para outros membros — admin e moderadores sempre veem tudo.
        </p>

        <div className="mt-2.5 flex flex-col gap-2">
          <PrivacyToggleRow
            label="Mostrar minhas músicas no perfil"
            checked={showMusicasNoPerfil}
            disabled={savingPrivacy}
            onToggle={() => handlePrivacyToggle('showMusicasNoPerfil', !showMusicasNoPerfil)}
          />

          <PrivacyToggleRow
            label="Mostrar espaço de armazenamento usado"
            checked={showEspacoUploadNoPerfil}
            disabled={savingPrivacy}
            onToggle={() => handlePrivacyToggle('showEspacoUploadNoPerfil', !showEspacoUploadNoPerfil)}
          />

          <PrivacyToggleRow
            label="Mostrar meus contatos (e-mail/telefone) para outros membros"
            checked={showContatosNoPerfil}
            disabled={savingPrivacy}
            onToggle={() => handlePrivacyToggle('showContatosNoPerfil', !showContatosNoPerfil)}
          />

          <PrivacyToggleRow
            label="Aceitar novos comentários nas minhas músicas"
            checked={allowComentariosNaMusica}
            disabled={savingPrivacy}
            onToggle={() => handlePrivacyToggle('allowComentariosNaMusica', !allowComentariosNaMusica)}
          />

          <PrivacyToggleRow
            label="Comentários recebidos ficam visíveis para outros"
            checked={showComentariosVisiveis}
            disabled={savingPrivacy}
            onToggle={() => handlePrivacyToggle('showComentariosVisiveis', !showComentariosVisiveis)}
          />

          {isArtist && (
            <PrivacyToggleRow
              label="Mostrar meu nome para outros membros"
              checked={showName}
              disabled={savingPrivacy}
              onToggle={() => handlePrivacyToggle('showName', !showName)}
            />
          )}
        </div>

        <p className="mt-2 text-[11px] text-white/30">
          Se você desligar &quot;Aceitar novos comentários&quot;, o formulário de comentar some das suas músicas para os outros (você continua vendo).
          Se desligar &quot;Comentários recebidos visíveis&quot;, só o autor de cada comentário, você e admin/moderador continuam vendo — o comentário não é apagado.
        </p>

        {isArtist && (
          <p className="mt-2 text-[11px] text-white/30">
            Ouvintes sempre exibem o nome. Artistas podem mostrar só o nome artístico.
          </p>
        )}

        {privacyError && <p className="mt-2 text-[11px] text-red-400">{privacyError}</p>}
      </section>

      {/* Nome artístico — é o que aparece nas músicas e no perfil público */}
      {isArtist && (
        <form onSubmit={handleArtisticNameSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Nome artístico</h2>
          <p className="mt-1 text-[11px] text-white/40">
            É o nome exibido nas suas músicas e no seu perfil — diferente do seu nome real.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={artisticNameValue}
              onChange={(e) => setArtisticNameValue(e.target.value)}
              maxLength={50}
              className="min-w-0 flex-1 rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
            />
            <button
              type="submit"
              disabled={savingArtisticName}
              className="rounded-md bg-gate-pink px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {savingArtisticName ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
          {artisticNameMessage && <span className="mt-1.5 block text-[11px] text-gate-blue">{artisticNameMessage}</span>}
        </form>
      )}

      {/* Nome */}
      <form onSubmit={handleNameSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Nome</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            className="min-w-0 flex-1 rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
          />
          <button
            type="submit"
            disabled={savingName}
            className="rounded-md bg-gate-pink px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {savingName ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
        {nameMessage && <span className="mt-1.5 block text-[11px] text-gate-blue">{nameMessage}</span>}
      </form>

      {/* Senha */}
      <form onSubmit={handlePasswordSubmit} className="rounded-lg border border-gate-azure bg-white/5 p-3.5">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-gate-blue">Trocar senha</h2>

        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Senha atual"
            className="w-full rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            placeholder="Nova senha"
            className="w-full rounded-md border border-gate-azure bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-gate-pink focus:ring-1 focus:ring-gate-pink/40"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-md bg-gate-pink px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {savingPassword ? 'Salvando…' : 'Trocar senha'}
          </button>
          {passwordError && <span className="text-[11px] text-red-400">{passwordError}</span>}
          {passwordSuccess && <span className="text-[11px] text-emerald-400">Senha atualizada.</span>}
        </div>
      </form>
    </div>
  )
}
